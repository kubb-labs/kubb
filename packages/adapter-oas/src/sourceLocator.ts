import { escapePointerToken, memo, unescapePointerToken } from '@internals/utils'
import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

/**
 * A key or a sequence item among its siblings, by entry index. Its own children are the entries after it, up to `to`.
 */
type BlockChild = { index: number; to: number }

// Diagnostics of one run share a source, so its index, and the document parsed for what the index cannot read, is kept for the next call.
let cached:
  | { source: string; block: ReturnType<typeof indexBlock>; document?: yaml.Document }
  | { source: string; json: ReturnType<typeof indexJson> }
  | undefined

// A key and its colon, the key double-quoted, single-quoted or plain. A plain key ends at the first colon that a space or
// the line end follows. A double-quoted one with an escape is left to the YAML parser.
const keyPattern = /(?:"([^"\\\n]*)"|'((?:[^'\n]|'')*)'|([^\s'"?{}[\],#&*!|>%@`][^\n]*?)) *:(?= |\r?$)/my

// A `$ref` key and its value, quoted the same ways. A plain value ends before a comment and trailing spaces.
const refPattern = /\$ref["']? *: +(?:"([^"\\\n]*)"|'((?:[^'\n]|'')*)'|(\S[^\n]*?))(?= +#|[ \t\r]*$)/gm

/**
 * The text of a scalar that `keyPattern` or `refPattern` matched, with the length it has in the source.
 */
function readScalar([, double, single, plain]: RegExpExecArray): { text: string; length: number } {
  if (plain !== undefined) return { text: plain, length: plain.length }
  if (double !== undefined) return { text: double, length: double.length + 2 }
  return { text: single!.replaceAll("''", "'"), length: single!.length + 2 }
}

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

/**
 * One pass over the lines of YAML text, so a located diagnostic in a large YAML spec skips
 * `yaml.parseDocument`, which takes several times longer than the build's own parse and keeps a
 * node for every value. The keys of a mapping are read the first time a pointer walks through it.
 */
function indexBlock(source: string) {
  // One entry per sequence dash and per text that follows a dash or starts a line: where it starts and how deep it sits.
  const offsets: Array<number> = []
  const depths: Array<number> = []
  // Children by the index of their first entry.
  const collections = new Map<number, { keys: Map<string, BlockChild>; items: Array<BlockChild>; partial: boolean }>()
  let refs: Map<string, NonNullable<Range>> | undefined

  const skipSpaces = (at: number) => {
    let next = at
    while (source.charCodeAt(next) === 32) next++
    return next
  }
  // The end of the text, a line break or a comment.
  const isBlank = (at: number) => at >= source.length || '\n\r#'.includes(source[at]!)

  for (let start = 0, end = 0; end !== -1; start = end + 1) {
    let at = skipSpaces(start)
    end = source.indexOf('\n', at)
    if (source.startsWith('---', start)) continue
    // Twice the column, plus one for a dash: an item nests under a key at its own indent, and deeper text nests under the item.
    while (source[at] === '-' && (isBlank(at + 1) || source[at + 1] === ' ')) {
      offsets.push(at)
      depths.push((at - start) * 2 + 1)
      at = skipSpaces(at + 1)
    }
    if (isBlank(at)) continue
    offsets.push(at)
    depths.push((at - start) * 2)
  }

  const isItem = (index: number) => depths[index]! % 2 === 1
  const readKey = (at: number) => {
    keyPattern.lastIndex = at
    const match = keyPattern.exec(source)
    if (!match) return undefined
    const { text, length } = readScalar(match)
    const value = skipSpaces(at + match[0].length)
    return { text, end: at + length, inline: isBlank(value) ? '' : source[value]! }
  }

  // The entries between `from` and `to` at the depth of the first one. Each ends where the next begins.
  const readChildren = (from: number, to: number) => {
    const keys = new Map<string, BlockChild>()
    const items: Array<BlockChild> = []
    const depth = depths[from]!
    let partial = false
    let last: BlockChild | undefined
    for (let index = from; index < to; index++) {
      if (depths[index] !== depth) continue
      if (last) last.to = index
      last = { index, to }
      if (isItem(index)) {
        items.push(last)
        continue
      }
      const key = readKey(offsets[index]!)
      // A duplicate key keeps its first range, like `findPointer`.
      if (key && !keys.has(key.text)) keys.set(key.text, last)
      partial ||= !key
    }
    return { keys, items, partial }
  }

  return {
    /**
     * Walks a JSON pointer through block mappings and sequences, like `findPointer`. `undefined` when the walk meets syntax
     * the index does not read, such as a flow collection, an anchor or a tag, so the caller parses the document instead.
     */
    find(pointer: string): { range: Range } | undefined {
      let parent: BlockChild = { index: -1, to: offsets.length }
      let range: Range
      let unread = false

      for (const token of pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken)) {
        if (unread) return undefined
        const from = parent.index + 1
        const { to } = parent
        if (from >= to) return { range: undefined }
        const { keys, items, partial } = memo(collections, from, () => readChildren(from, to))
        const child = keys.get(token) ?? items[Number(token)]
        if (!child) return partial ? undefined : { range: undefined }
        parent = child
        const start = offsets[child.index]!

        if (isItem(child.index)) {
          // An item starts at its text, and runs to the last text before the next item.
          const end = source.slice(0, offsets[child.to] ?? source.length).trimEnd().length
          range = { start: child.index + 1 < child.to ? offsets[child.index + 1]! : start, end }
          continue
        }

        const key = readKey(start)!
        range = { start, end: key.end }
        // A value on the key's own line is a scalar, with nothing under it, or syntax the index does not read.
        if (key.inline) {
          unread = '{[&*!'.includes(key.inline)
          parent = { index: child.index, to: child.index + 1 }
        }
      }
      return { range }
    },
    /**
     * The value range of the first usage of `ref` as a block mapping key.
     */
    findRef(ref: string): Range {
      if (!refs) {
        refs = new Map()
        for (const match of source.matchAll(refPattern)) {
          // A key has only its indent, sequence dashes and an opening quote before it on its line.
          if (!/^ *(?:- +)*["']?$/.test(source.slice(source.lastIndexOf('\n', match.index) + 1, match.index))) continue
          const { text, length } = readScalar(match)
          const end = match.index + match[0].length
          if (!refs.has(text)) refs.set(text, { start: end - length, end })
        }
      }
      return refs.get(ref)
    },
  }
}

/** Indexes plain JSON text by pointer and any other text by line. */
function parse(source: string): NonNullable<typeof cached> {
  if (/^[ \t\n\r]*\{/.test(source)) {
    try {
      return { source, json: indexJson(source) }
    } catch {
      // Not plain JSON, such as YAML flow style with comments.
    }
  }
  return { source, block: indexBlock(source) }
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
  const found = cached.block.find(location.pointer)
  const range = found?.range ?? (found && ref ? cached.block.findRef(ref) : undefined)
  // A pointer the document does not hold has no range, unless it names a reference whose usage the index missed.
  if (range || (found && !ref)) return range

  const document = (cached.document ??= yaml.parseDocument(source))
  return findPointer(document, location.pointer) ?? (ref ? findRefUsage(document, ref) : undefined)
}
