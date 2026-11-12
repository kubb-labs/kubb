import { hash } from 'node:crypto'
import { memo, unescapePointerToken } from '@internals/utils'
import type { Adapter } from '@kubb/core'
import { COLLECTION_STYLE, CORE_SCHEMA, EVENT_ID, load, parseEvents, SCALAR_STYLE } from 'js-yaml'
import type { Event } from 'js-yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

type Child = { index: number; range: NonNullable<Range> }

// One entry per event in typed arrays: an event object per value takes ten times the memory.
type EventIndex = {
  types: Uint8Array
  styles: Uint8Array
  starts: Int32Array
  ends: Int32Array
  collections: Map<number, { keys: Map<string, Child>; items: Array<Child> }>
  refs?: Map<string, NonNullable<Range>>
}

// Diagnostics of one run share a source, so its index is kept, under a hash so the adapter can let the text go.
let cached: { key: string; source?: string; index: EventIndex | undefined } | undefined

// A plain `1.50` or `~` is a number or null to `js-yaml`, so the document, and the pointer, spell it `1.5` or `null`.
function toKeyText(text: string): string {
  if (!/^[-+.~\d]|^(?:null|true|false)$/i.test(text)) return text
  try {
    const value = load(text, { schema: CORE_SCHEMA })
    return value === null || typeof value === 'number' || typeof value === 'boolean' ? String(value) : text
  } catch {
    return text
  }
}

function indexEvents(events: ReadonlyArray<Event>): EventIndex {
  const types = new Uint8Array(events.length)
  const styles = new Uint8Array(events.length)
  const starts = new Int32Array(events.length)
  const ends = new Int32Array(events.length)

  for (let at = 0; at < events.length; at++) {
    const event = events[at]!
    types[at] = event.type
    if (event.type === EVENT_ID.SCALAR) {
      // Quotes sit outside the offsets of a scalar's value.
      const quote = event.style === SCALAR_STYLE.SINGLE_QUOTED || event.style === SCALAR_STYLE.DOUBLE_QUOTED ? 1 : 0
      styles[at] = event.style
      starts[at] = event.valueStart - quote
      ends[at] = event.valueEnd + quote
    }
    if (event.type === EVENT_ID.ALIAS) {
      starts[at] = event.anchorStart - 1
      ends[at] = event.anchorEnd
    }
    if (event.type === EVENT_ID.MAPPING || event.type === EVENT_ID.SEQUENCE) {
      styles[at] = event.style
      starts[at] = event.start
    }
  }
  return { types, styles, starts, ends, collections: new Map() }
}

function createLocator({ index, source }: { index: EventIndex; source: string }) {
  const { types, styles, starts, ends, collections } = index
  const isCollection = (at: number) => types[at] === EVENT_ID.MAPPING || types[at] === EVENT_ID.SEQUENCE

  // `undefined` for a double-quoted scalar with an escape that JSON does not have, such as `\x41`.
  const readText = (at: number): string | undefined => {
    const text = source.slice(starts[at], ends[at])
    if (styles[at] === SCALAR_STYLE.SINGLE_QUOTED) return text.slice(1, -1).replaceAll("''", "'")
    if (styles[at] !== SCALAR_STYLE.DOUBLE_QUOTED) return text
    try {
      return JSON.parse(text) as string
    } catch {
      return undefined
    }
  }

  const readNode = (at: number): NonNullable<Range> & { next: number } => {
    if (!isCollection(at)) return { start: starts[at]!, end: ends[at]!, next: at + 1 }
    let next = at + 1
    let end = starts[at]!
    while (types[next] !== EVENT_ID.POP) ({ end, next } = readNode(next))
    // A flow collection ends at its closing bracket, which no event marks.
    if (styles[at] === COLLECTION_STYLE.FLOW) end = source.indexOf(types[at] === EVENT_ID.MAPPING ? '}' : ']', end) + 1
    return { start: starts[at]!, end, next: next + 1 }
  }

  const readChildren = (collection: number) => {
    const keys = new Map<string, Child>()
    const items: Array<Child> = []
    const isMapping = types[collection] === EVENT_ID.MAPPING
    for (let at = collection + 1; types[at] !== EVENT_ID.POP;) {
      const key = isMapping ? at : undefined
      if (key !== undefined) at = readNode(at).next
      const { start, end, next } = readNode(at)
      if (key === undefined) items.push({ index: at, range: { start, end } })
      const raw = key !== undefined && types[key] === EVENT_ID.SCALAR ? readText(key) : undefined
      const text = raw !== undefined && styles[key!] === SCALAR_STYLE.PLAIN ? toKeyText(raw) : raw
      if (text !== undefined && !keys.has(text)) keys.set(text, { index: at, range: { start: starts[key!]!, end: ends[key!]! } })
      at = next
    }
    return { keys, items }
  }

  return {
    find(pointer: string): Range {
      // The first event opens the document, the second is its root.
      let at = 1
      let range: Range
      for (const token of pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken)) {
        if (!isCollection(at)) return undefined
        const collection = at
        const { keys, items } = memo(collections, collection, () => readChildren(collection))
        const child = keys.get(token) ?? items[Number(token)]
        if (!child) return undefined
        at = child.index
        range = child.range
      }
      return range
    },
    findRef(ref: string): Range {
      if (!index.refs) {
        index.refs = new Map()
        for (let at = 0; at + 1 < types.length; at++) {
          if (types[at] !== EVENT_ID.SCALAR || types[at + 1] !== EVENT_ID.SCALAR || readText(at) !== '$ref') continue
          const text = readText(at + 1)
          if (text !== undefined && !index.refs.has(text)) index.refs.set(text, { start: starts[at + 1]!, end: ends[at + 1]! })
        }
      }
      return index.refs.get(ref)
    },
  }
}

function parse(source: string): EventIndex | undefined {
  try {
    return indexEvents(parseEvents(source, {}))
  } catch {
    // Text that is not YAML has no locations.
    return undefined
  }
}

export function rememberEvents({ source, events }: { source: string; events: ReadonlyArray<Event> }): void {
  cached = { key: hash('sha256', source), index: indexEvents(events) }
}

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  if (cached?.source !== source) {
    const key = hash('sha256', source)
    cached = cached?.key === key ? cached : { key, index: parse(source) }
  }
  // An equal but distinct string costs a full comparison on every check. Keeping the caller's
  // string turns the next checks into identity hits.
  cached.source = source
  if (!cached.index) return undefined

  const { find, findRef } = createLocator({ index: cached.index, source })
  const ref = 'ref' in location ? location.ref : undefined
  return find(location.pointer) ?? (ref ? findRef(ref) : undefined)
}
