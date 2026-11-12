import { memo, unescapePointerToken } from '@internals/utils'
import type { Adapter } from '@kubb/core'
import { COLLECTION_STYLE, EVENT_ID, getScalarValue, parseEvents, SCALAR_STYLE } from 'js-yaml'
import type { AliasEvent, ScalarEvent } from 'js-yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

/**
 * A value in a mapping or a sequence: the index of its event, and the range of its key or of the item itself.
 */
type Child = { index: number; range: NonNullable<Range> }

// Diagnostics of one run share a source, so its index is kept for the next call. A source that does not parse has none.
let cached: { source: string; index: ReturnType<typeof indexSource> | undefined } | undefined

/**
 * Parses YAML or JSON text into `js-yaml`'s flat event stream, which marks every key and value by
 * its offsets. That takes about a tenth of the time of a `yaml` document and reads JSON too. The
 * children of a mapping or a sequence are read the first time a pointer walks through it.
 */
function indexSource(source: string) {
  const events = parseEvents(source, {})
  // Children by the index of their collection's opening event.
  const collections = new Map<number, { keys: Map<string, Child>; items: Array<Child> }>()
  let refs: Map<string, NonNullable<Range>> | undefined

  // Quotes sit outside the offsets of a scalar's value.
  const scalarRange = (event: ScalarEvent) => {
    const quote = event.style === SCALAR_STYLE.SINGLE_QUOTED || event.style === SCALAR_STYLE.DOUBLE_QUOTED ? 1 : 0
    return { start: event.valueStart - quote, end: event.valueEnd + quote }
  }

  // The range of the node at `index`, and the index of the event after it.
  const readNode = (index: number): NonNullable<Range> & { next: number } => {
    const event = events[index]!
    if (event.type === EVENT_ID.SCALAR) return { ...scalarRange(event), next: index + 1 }
    if (event.type === EVENT_ID.MAPPING || event.type === EVENT_ID.SEQUENCE) {
      let next = index + 1
      let end = event.start
      while (events[next]!.type !== EVENT_ID.POP) ({ end, next } = readNode(next))
      // A flow collection ends at its closing bracket, which no event marks.
      if (event.style === COLLECTION_STYLE.FLOW) end = source.indexOf(event.type === EVENT_ID.MAPPING ? '}' : ']', end) + 1
      return { start: event.start, end, next: next + 1 }
    }
    // Only an alias is left where a node starts.
    const { anchorStart, anchorEnd } = event as AliasEvent
    return { start: anchorStart - 1, end: anchorEnd, next: index + 1 }
  }

  const readChildren = (index: number) => {
    const keys = new Map<string, Child>()
    const items: Array<Child> = []
    const isMapping = events[index]!.type === EVENT_ID.MAPPING
    for (let at = index + 1; events[at]!.type !== EVENT_ID.POP;) {
      const key = isMapping ? events[at]! : undefined
      if (key) at = readNode(at).next
      const { start, end, next } = readNode(at)
      if (!key) items.push({ index: at, range: { start, end } })
      if (key?.type === EVENT_ID.SCALAR) {
        const text = getScalarValue(source, key)
        // A duplicate key keeps its first range.
        if (!keys.has(text)) keys.set(text, { index: at, range: scalarRange(key) })
      }
      at = next
    }
    return { keys, items }
  }

  return {
    /**
     * Walks a JSON pointer through mappings and sequences. The range is the last key or item it reached.
     */
    find(pointer: string): Range {
      // The first event opens the document, the second is its root.
      let index = 1
      let range: Range
      for (const token of pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken)) {
        const type = events[index]?.type
        if (type !== EVENT_ID.MAPPING && type !== EVENT_ID.SEQUENCE) return undefined
        const at = index
        const { keys, items } = memo(collections, at, () => readChildren(at))
        const child = keys.get(token) ?? items[Number(token)]
        if (!child) return undefined
        index = child.index
        range = child.range
      }
      return range
    },
    /**
     * The value range of the first `$ref` whose value is `ref`.
     */
    findRef(ref: string): Range {
      if (!refs) {
        refs = new Map()
        for (const [index, event] of events.entries()) {
          const value = events[index + 1]
          if (event.type !== EVENT_ID.SCALAR || value?.type !== EVENT_ID.SCALAR) continue
          if (event.valueEnd - event.valueStart !== 4 || !source.startsWith('$ref', event.valueStart)) continue
          const text = getScalarValue(source, value)
          if (!refs.has(text)) refs.set(text, scalarRange(value))
        }
      }
      return refs.get(ref)
    },
  }
}

function parse(source: string): ReturnType<typeof indexSource> | undefined {
  try {
    return indexSource(source)
  } catch {
    // Text that is not YAML has no locations.
    return undefined
  }
}

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  // An equal but distinct string costs a full comparison on every check. Keeping the caller's
  // string turns the next checks into identity hits.
  cached = cached?.source === source ? { ...cached, source } : { source, index: parse(source) }
  const ref = 'ref' in location ? location.ref : undefined
  return cached.index?.find(location.pointer) ?? (ref ? cached.index?.findRef(ref) : undefined)
}
