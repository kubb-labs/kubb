import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

// Diagnostics of one run share a source, so its parsed document, or its JSON scanner, is kept for the next call.
let cached: { source: string; document: yaml.Document } | { source: string; json: ReturnType<typeof scanJson> } | undefined

const toRange = ([start, end]: yaml.Range): Range => ({ start, end })

const unescapeToken = (token: string) => token.replaceAll('~1', '/').replaceAll('~0', '~')

/** Walks a JSON pointer through maps and sequences; the range is the last key or item it reached. */
function findPointer(document: yaml.Document, pointer: string): Range {
  const tokens = pointer.replace(/^#/, '').split('/').slice(1).map(unescapeToken)
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

type JsonEntry = { start: number; end: number; value: number }

/**
 * Finds ranges in JSON text without building a document, so a located diagnostic in a large JSON
 * spec skips `yaml.parseDocument`. Each object and array is scanned once and kept, so many lookups
 * cost at most one pass. The ranges match what `findPointer` and `findRefUsage` return for the same
 * text. Throws on text that is not plain JSON, such as YAML flow style with comments.
 */
function scanJson(source: string) {
  let at = 0
  const objects = new Map<number, Map<string, JsonEntry>>()
  const arrays = new Map<number, Array<{ start: number; end: number }>>()
  let refs: Map<string, { start: number; end: number }> | undefined

  const fail = (): never => {
    throw new SyntaxError(`Unexpected character at ${at}`)
  }
  const skipSpace = () => {
    for (let code = source.charCodeAt(at); code === 32 || code === 9 || code === 10 || code === 13; code = source.charCodeAt(++at));
  }
  const skipString = () => {
    for (at++; at < source.length; at++) {
      const code = source.charCodeAt(at)
      if (code === 92) at++
      else if (code === 34) return ++at
    }
    return fail()
  }
  const readString = () => {
    if (source.charCodeAt(at) !== 34) fail()
    const start = at
    const end = skipString()
    const raw = source.slice(start + 1, end - 1)
    return { text: raw.includes('\\') ? (JSON.parse(source.slice(start, end)) as string) : raw, start, end }
  }
  const skipValue = (): number => {
    const code = source.charCodeAt(at)
    if (code === 34) return skipString()
    if (code === 123 || code === 91) {
      let depth = 0
      for (; at < source.length; at++) {
        const inner = source.charCodeAt(at)
        if (inner === 34) {
          skipString()
          at--
        } else if (inner === 123 || inner === 91) depth++
        else if ((inner === 125 || inner === 93) && --depth === 0) return ++at
      }
      return fail()
    }
    const start = at
    while (at < source.length && !/[\s,\]}]/.test(source[at]!)) at++
    return at > start ? at : fail()
  }
  // Moves past `,` to the next entry; false at the closing `close` character.
  const next = (close: number) => {
    skipSpace()
    if (source.charCodeAt(at) === 44) {
      at++
      skipSpace()
      return true
    }
    if (source.charCodeAt(at) !== close) fail()
    at++
    return false
  }
  // The entries of the object or array that opens at `open`, with `at` past its first space.
  const enter = (open: number) => {
    at = open + 1
    skipSpace()
    if (source.charCodeAt(at) !== (source.charCodeAt(open) === 123 ? 125 : 93)) return true
    at++
    return false
  }
  const entriesAt = (open: number) => {
    let entries = objects.get(open)
    if (entries) return entries
    entries = new Map()
    for (let more = enter(open); more; more = next(125)) {
      const { text, start, end } = readString()
      skipSpace()
      if (source.charCodeAt(at++) !== 58) fail()
      skipSpace()
      const value = at
      skipValue()
      // A duplicate key keeps its first range, like `findPointer`.
      if (!entries.has(text)) entries.set(text, { start, end, value })
    }
    objects.set(open, entries)
    return entries
  }
  const itemsAt = (open: number) => {
    let items = arrays.get(open)
    if (items) return items
    items = []
    for (let more = enter(open); more; more = next(93)) {
      const start = at
      items.push({ start, end: skipValue() })
    }
    arrays.set(open, items)
    return items
  }
  // Every `$ref` string value by its first usage, depth first in document order like `yaml.visit`.
  const collectRefs = (found: Map<string, { start: number; end: number }>) => {
    skipSpace()
    const open = at
    const code = source.charCodeAt(open)
    if (code !== 123 && code !== 91) {
      skipValue()
      return
    }
    for (let more = enter(open); more; more = next(code === 123 ? 125 : 93)) {
      if (code === 91) {
        collectRefs(found)
        continue
      }
      const { text } = readString()
      skipSpace()
      if (source.charCodeAt(at++) !== 58) fail()
      skipSpace()
      if (text !== '$ref' || source.charCodeAt(at) !== 34) {
        collectRefs(found)
        continue
      }
      const value = readString()
      if (!found.has(value.text)) found.set(value.text, { start: value.start, end: value.end })
    }
  }

  return {
    pointer(tokens: Array<string>): Range {
      at = 0
      skipSpace()
      let position = at
      let range: Range
      for (const token of tokens) {
        const code = source.charCodeAt(position)
        if (code === 123) {
          const entry = entriesAt(position).get(token)
          if (!entry) return undefined
          range = { start: entry.start, end: entry.end }
          position = entry.value
        } else if (code === 91) {
          const item = itemsAt(position)[Number(token)]
          if (!item) return undefined
          range = { start: item.start, end: item.end }
          position = item.start
        } else {
          return undefined
        }
      }
      return range
    },
    ref(ref: string): Range {
      if (!refs) {
        const found = new Map<string, { start: number; end: number }>()
        at = 0
        collectRefs(found)
        refs = found
      }
      const range = refs.get(ref)
      return range && { ...range }
    },
  }
}

const isJson = (source: string) => /^[ \t\n\r]*\{/.test(source)

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  if (cached?.source === source) {
    // An equal but distinct string costs a full comparison on every check. Keeping the caller's
    // string turns the next checks into identity hits.
    cached.source = source
  } else {
    cached = isJson(source) ? { source, json: scanJson(source) } : { source, document: yaml.parseDocument(source) }
  }
  const ref = 'ref' in location ? location.ref : undefined
  if ('json' in cached) {
    try {
      const tokens = location.pointer.replace(/^#/, '').split('/').slice(1).map(unescapeToken)
      return cached.json.pointer(tokens) ?? (ref ? cached.json.ref(ref) : undefined)
    } catch {
      // Not plain JSON after all, so the YAML parser handles this source from now on.
      cached = { source, document: yaml.parseDocument(source) }
    }
  }
  const { document } = cached
  return findPointer(document, location.pointer) ?? (ref ? findRefUsage(document, ref) : undefined)
}
