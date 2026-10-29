import { escapePointerToken, unescapePointerToken } from '@internals/utils'
import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

// Diagnostics of one run share a source, so its parsed document, or its JSON index, is kept for the next call.
let cached: { source: string; document: yaml.Document } | { source: string; json: ReturnType<typeof indexJson> } | undefined

const toRange = ([start, end]: yaml.Range): Range => ({ start, end })

/** Walks a JSON pointer through maps and sequences; the range is the last key or item it reached. */
function findPointer(document: yaml.Document, pointer: string): Range {
  const tokens = pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken)
  return tokens.reduce<{ node: unknown; range: Range } | undefined>(
    (at, token) => {
      if (yaml.isMap(at?.node)) {
        const pair = at.node.items.find((item) => yaml.isScalar(item.key) && String(item.key.value) === token)
        return pair && yaml.isScalar(pair.key) && pair.key.range ? { node: pair.value, range: toRange(pair.key.range) } : undefined
      }
      if (yaml.isSeq(at?.node)) {
        const item = at.node.items[Number(token)]
        return yaml.isNode(item) && item.range ? { node: item, range: toRange(item.range) } : undefined
      }
      return undefined
    },
    { node: document.contents, range: undefined },
  )?.range
}

/** The first `$ref` whose value is `ref`. */
function findRefUsage(document: yaml.Document, ref: string): Range {
  const found: Array<Range> = []
  yaml.visit(document, {
    Pair(_, { key, value }) {
      if (!yaml.isScalar(key) || key.value !== '$ref' || !yaml.isScalar(value) || value.value !== ref || !value.range) return
      found.push(toRange(value.range))
      return yaml.visit.BREAK
    },
  })
  return found[0]
}

/**
 * One pass over JSON text, so a located diagnostic in a large JSON spec skips `yaml.parseDocument`.
 * Holds the range of every key and array item by pointer, and the first usage of every `$ref`, as
 * `findPointer` and `findRefUsage` return them. Throws where the text breaks JSON syntax, such as a
 * comment, an unquoted key, or an unquoted `$ref` value. Other bare values, such as `object`, pass.
 */
function indexJson(source: string) {
  const pointers = new Map<string, NonNullable<Range>>()
  const refs = new Map<string, NonNullable<Range>>()
  let at = source.indexOf('{')

  const fail = (): never => {
    throw new SyntaxError(`Unexpected character at ${at}`)
  }
  const skipSpace = () => {
    for (let code = source.charCodeAt(at); code === 32 || code === 9 || code === 10 || code === 13; code = source.charCodeAt(++at));
  }
  const readString = () => {
    if (source[at] !== '"') fail()
    const start = at
    for (at++; source.charCodeAt(at) !== 34; at++) {
      if (at >= source.length) fail()
      if (source.charCodeAt(at) === 92) at++
    }
    const raw = source.slice(start + 1, at++)
    return { text: raw.includes('\\') ? (JSON.parse(source.slice(start, at)) as string) : raw, start, end: at }
  }
  const expect = (char: string) => {
    skipSpace()
    if (source[at++] !== char) fail()
    skipSpace()
  }
  // Walks the value at `at`; `pointer` is where it sits.
  const walk = (pointer: string): void => {
    const open = source[at]
    if (open === '"') {
      readString()
      return
    }
    if (open !== '{' && open !== '[') {
      const start = at
      while (at < source.length && !/[\s,\]}]/.test(source[at]!)) at++
      if (at === start) fail()
      return
    }
    const close = open === '{' ? '}' : ']'
    at++
    for (let index = 0; ; index++) {
      skipSpace()
      if (source[at] === close) break
      if (index > 0) expect(',')
      if (open === '[') {
        const start = at
        const next = `${pointer}/${index}`
        walk(next)
        if (!pointers.has(next)) pointers.set(next, { start, end: at })
        continue
      }
      const key = readString()
      const next = `${pointer}/${escapePointerToken(key.text)}`
      // A duplicate key keeps its first range, like `findPointer`.
      if (!pointers.has(next)) pointers.set(next, { start: key.start, end: key.end })
      expect(':')
      if (key.text !== '$ref' || source[at] === '{' || source[at] === '[') {
        walk(next)
        continue
      }
      // YAML reads an unquoted `$ref` value as a string, so only the YAML parser finds that usage.
      const value = readString()
      if (!refs.has(value.text)) refs.set(value.text, { start: value.start, end: value.end })
    }
    at++
  }
  walk('#')
  return { pointers, refs }
}

/** Indexes plain JSON text; anything else goes to the YAML parser. */
function parse(source: string): NonNullable<typeof cached> {
  if (/^[ \t\n\r]*\{/.test(source)) {
    try {
      return { source, json: indexJson(source) }
    } catch {
      // Not plain JSON, such as YAML flow style with comments.
    }
  }
  return { source, document: yaml.parseDocument(source) }
}

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  // An equal but distinct string costs a full comparison on every check. Keeping the caller's
  // string turns the next checks into identity hits.
  cached = cached?.source === source ? { ...cached, source } : parse(source)
  const ref = 'ref' in location ? location.ref : undefined
  if ('json' in cached) {
    const { pointers, refs } = cached.json
    return pointers.get(location.pointer) ?? (ref ? refs.get(ref) : undefined)
  }
  const { document } = cached
  return findPointer(document, location.pointer) ?? (ref ? findRefUsage(document, ref) : undefined)
}
