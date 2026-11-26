import { memo, unescapePointerToken } from '@internals/utils'
import type { Adapter, SourceRange } from '@kubb/core'
import { COLLECTION_STYLE, CORE_SCHEMA, EVENT_ID, load, parseEvents, SCALAR_STYLE } from 'js-yaml'
import type { Event } from 'js-yaml'

type Child = { index: number; range: SourceRange }

// One entry per event in typed arrays: an event object per value takes ten times the memory.
type EventIndex = {
  types: Uint8Array
  styles: Uint8Array
  starts: Int32Array
  ends: Int32Array
  collections: Map<number, { keys: Map<string, Child>; items: Array<Child> }>
  refs?: Map<string, SourceRange>
}

const flowGap = /(?:[\s,]|#[^\n]*)*/y

// Diagnostics of one run share a source, so its index is kept for the next call.
const indexes = memo.create<string, EventIndex | undefined>({ max: 1 })

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

  for (let at = 0, last = 0; at < events.length; last = Math.max(last, starts[at]!, ends[at]!), at++) {
    const event = events[at]!
    types[at] = event.type
    if (event.type === EVENT_ID.SCALAR) {
      // Quotes sit outside the offsets of a scalar's value. An empty value has none, so it sits where the node before it ended.
      const quote = event.style === SCALAR_STYLE.SINGLE_QUOTED || event.style === SCALAR_STYLE.DOUBLE_QUOTED ? 1 : 0
      const empty = event.valueStart < 0
      styles[at] = event.style
      starts[at] = empty ? last : event.valueStart - quote
      ends[at] = empty ? last : event.valueEnd + quote
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

type SourceLocatorOptions = { index: EventIndex; source: string }

class SourceLocator {
  readonly #index: EventIndex
  readonly #source: string
  readonly #types: Uint8Array
  readonly #styles: Uint8Array
  readonly #starts: Int32Array
  readonly #ends: Int32Array

  constructor({ index, source }: SourceLocatorOptions) {
    this.#index = index
    this.#source = source
    this.#types = index.types
    this.#styles = index.styles
    this.#starts = index.starts
    this.#ends = index.ends
  }

  find(pointer: string): SourceRange | undefined {
    // The first event opens the document, the second is its root.
    return this.#walk({ at: 1, tokens: pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken), range: undefined })
  }

  findRef(ref: string): SourceRange | undefined {
    this.#index.refs ??= this.#indexRefs()
    return this.#index.refs.get(ref)
  }

  // Every `$ref` value in the document, mapped to the range of its first occurrence.
  #indexRefs(): Map<string, SourceRange> {
    const types = this.#types
    const refs = new Map<string, SourceRange>()
    // -1 in a sequence. In a mapping, 0 before a key and 1 before its value.
    const frames: Array<number> = []
    for (let at = 1; at + 1 < types.length; at++) {
      if (!this.#stepFrames({ frames, at }) || !this.#isRefKey(at)) continue
      const text = this.#readText(at + 1)
      if (!refs.has(text)) refs.set(text, { start: this.#starts[at + 1]!, end: this.#ends[at + 1]! })
    }
    return refs
  }

  // Moves `frames` past the event at `at`, and tells whether that event is a mapping key.
  #stepFrames({ frames, at }: { frames: Array<number>; at: number }): boolean {
    if (this.#types[at] === EVENT_ID.POP) {
      frames.pop()
      return false
    }
    const top = frames.length - 1
    const isKey = frames[top] === 0
    if (frames[top]! >= 0) frames[top] = 1 - frames[top]!
    if (this.#isCollection(at)) frames.push(this.#types[at] === EVENT_ID.MAPPING ? 0 : -1)
    return isKey
  }

  // A `$ref` key followed by its scalar value.
  #isRefKey(at: number): boolean {
    return this.#types[at] === EVENT_ID.SCALAR && this.#types[at + 1] === EVENT_ID.SCALAR && this.#readText(at) === '$ref'
  }

  #isCollection(at: number): boolean {
    return this.#types[at] === EVENT_ID.MAPPING || this.#types[at] === EVENT_ID.SEQUENCE
  }

  #readText(at: number): string {
    const styles = this.#styles
    const text = this.#source.slice(this.#starts[at], this.#ends[at])
    if (styles[at] === SCALAR_STYLE.SINGLE_QUOTED) return text.slice(1, -1).replaceAll("''", "'")
    if (styles[at] !== SCALAR_STYLE.DOUBLE_QUOTED) return text
    try {
      return JSON.parse(text) as string
    } catch {
      return String(load(text, { schema: CORE_SCHEMA }))
    }
  }

  #readNode(at: number): SourceRange & { next: number } {
    const starts = this.#starts
    if (!this.#isCollection(at)) return { start: starts[at]!, end: this.#ends[at]!, next: at + 1 }
    let next = at + 1
    let end = starts[at]!
    while (this.#types[next] !== EVENT_ID.POP) ({ end, next } = this.#readNode(next))
    // A flow collection ends at its closing bracket, which no event marks, after any commas and comments.
    if (this.#styles[at] === COLLECTION_STYLE.FLOW) {
      flowGap.lastIndex = end
      flowGap.exec(this.#source)
      end = flowGap.lastIndex + 1
    }
    return { start: starts[at]!, end, next: next + 1 }
  }

  #readChildren(collection: number): { keys: Map<string, Child>; items: Array<Child> } {
    const types = this.#types
    const keys = new Map<string, Child>()
    const items: Array<Child> = []
    const isMapping = types[collection] === EVENT_ID.MAPPING
    for (let at = collection + 1; types[at] !== EVENT_ID.POP;) {
      const key = isMapping ? at : undefined
      if (key !== undefined) at = this.#readNode(at).next
      const { start, end, next } = this.#readNode(at)
      if (key === undefined) items.push({ index: at, range: { start, end } })
      const text = key !== undefined ? this.#readKey(key) : undefined
      if (text !== undefined && !keys.has(text)) keys.set(text, { index: at, range: { start: this.#starts[key!]!, end: this.#ends[key!]! } })
      at = next
    }
    return { keys, items }
  }

  #readKey(key: number): string | undefined {
    if (this.#types[key] !== EVENT_ID.SCALAR) return undefined
    const raw = this.#readText(key)
    return this.#styles[key] === SCALAR_STYLE.PLAIN ? toKeyText(raw) : raw
  }

  // Follows `tokens` from the collection at `at`. The range is the last key or item it reached.
  #walk({ at, tokens: [token, ...rest], range }: { at: number; tokens: Array<string>; range: SourceRange | undefined }): SourceRange | undefined {
    if (token === undefined) return range
    if (!this.#isCollection(at)) return undefined
    const { keys, items } = memo(this.#index.collections, at, () => this.#readChildren(at))
    const child = keys.get(token) ?? items[Number(token)]
    return child ? this.#walk({ at: child.index, tokens: rest, range: child.range }) : undefined
  }
}

function createSourceLocator(options: SourceLocatorOptions): SourceLocator {
  return new SourceLocator(options)
}

function parse(source: string): EventIndex | undefined {
  try {
    return indexEvents(parseEvents(source, { maxDepth: Number.POSITIVE_INFINITY }))
  } catch {
    // Text that is not YAML has no locations.
    return undefined
  }
}

export function rememberEvents({ source, events }: { source: string; events: ReadonlyArray<Event> }): void {
  indexes.set(source, indexEvents(events))
}

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  const index = memo(indexes, source, () => parse(source))
  if (!index) return undefined

  const locator = createSourceLocator({ index, source })
  const ref = 'ref' in location ? location.ref : undefined
  return locator.find(location.pointer) ?? (ref ? locator.findRef(ref) : undefined)
}
