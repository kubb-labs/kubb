import { readFile } from 'node:fs/promises'
import { styleText } from 'node:util'
import type * as YAML from 'yaml'

/**
 * Where a JSON pointer sits in the spec source, with a code frame that underlines it.
 */
export type SpecPosition = {
  line: number
  column: number
  frame: Array<string>
}

/**
 * Resolves a diagnostic's pointer, or for a missing `$ref` target the place that uses it.
 */
export type SpecLocator = (location: { pointer: string; ref?: string }) => SpecPosition | undefined

type Range = [start: number, end: number]

/** RFC 6901 tokens of a `#/a/b` pointer, unescaped. */
function toTokens(pointer: string): Array<string> {
  return pointer
    .replace(/^#/, '')
    .split('/')
    .slice(1)
    .map((token) => decodeURIComponent(token).replaceAll('~1', '/').replaceAll('~0', '~'))
}

/**
 * Builds a {@link SpecLocator} over YAML or JSON `source`. JSON parses as YAML, so one parser keeps
 * the source ranges for both.
 */
export function createSpecLocator(yaml: typeof YAML, source: string): SpecLocator {
  const lineCounter = new yaml.LineCounter()
  const document = yaml.parseDocument(source, { lineCounter })
  const lines = source.split(/\r?\n/)

  // Points at the key of the last token, so `#/components/schemas/Pet` underlines `Pet`.
  function findPointer(pointer: string): Range | undefined {
    let node: unknown = document.contents
    let range: Range | undefined
    for (const token of toTokens(pointer)) {
      if (yaml.isMap(node)) {
        const pair = node.items.find((item) => yaml.isScalar(item.key) && String(item.key.value) === token)
        if (!pair || !yaml.isScalar(pair.key) || !pair.key.range) return undefined
        range = [pair.key.range[0], pair.key.range[1]]
        node = pair.value
        continue
      }
      if (yaml.isSeq(node)) {
        const item = node.items[Number(token)]
        if (!yaml.isNode(item) || !item.range) return undefined
        range = [item.range[0], item.range[1]]
        node = item
        continue
      }
      return undefined
    }
    return range
  }

  function findRefUsage(ref: string): Range | undefined {
    let range: Range | undefined
    yaml.visit(document, {
      Pair(_, pair) {
        if (!yaml.isScalar(pair.key) || pair.key.value !== '$ref' || !yaml.isScalar(pair.value) || pair.value.value !== ref || !pair.value.range) return
        range = [pair.value.range[0], pair.value.range[1]]
        return yaml.visit.BREAK
      },
    })
    return range
  }

  return ({ pointer, ref }) => {
    const range = findPointer(pointer) ?? (ref ? findRefUsage(ref) : undefined)
    if (!range) return undefined

    const { line, col } = lineCounter.linePos(range[0])
    const text = lines[line - 1] ?? ''
    const width = String(line).length
    const gutter = (number?: number) => styleText('dim', `${number === undefined ? ''.padStart(width) : String(number).padStart(width)} │`)
    const carets = '^'.repeat(Math.max(1, Math.min(range[1] - range[0], text.length - col + 1)))

    return {
      line,
      column: col,
      frame: [
        ...(line > 1 ? [`${gutter(line - 1)} ${lines[line - 2]}`] : []),
        `${gutter(line)} ${text}`,
        `${gutter()} ${' '.repeat(col - 1)}${styleText('red', carets)}`,
      ],
    }
  }
}

/**
 * Reads and parses the spec at `path`, `undefined` when it cannot be read or parsed. Imports `yaml`
 * here, so a run without a located diagnostic never loads it.
 */
export async function loadSpecLocator(path: string): Promise<SpecLocator | undefined> {
  try {
    const [source, yaml] = await Promise.all([readFile(path, 'utf8'), import('yaml')])
    return createSpecLocator(yaml, source)
  } catch {
    return undefined
  }
}
