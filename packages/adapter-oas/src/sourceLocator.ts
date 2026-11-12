import { escapePointerToken, memo, unescapePointerToken } from '@internals/utils'
import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

/**
 * Where a block collection starts: the line of its first entry and the column its entries share.
 * The column is past the line's indent for a collection that opens on a sequence item's own line.
 */
type BlockNode = { line: number; column: number }

type BlockEntry = { line: number; start: number; end: number; value: number }

type BlockMap = { entries: Map<string, BlockEntry>; partial: boolean }

// Diagnostics of one run share a source, so its index, and the document parsed for what the index cannot read, is kept for the next call.
let cached:
  | { source: string; block: ReturnType<typeof indexBlock>; document?: yaml.Document }
  | { source: string; json: ReturnType<typeof indexJson> }
  | undefined

// Marks syntax the block index does not read, such as a flow collection, an anchor or a tag.
const unsupported = Symbol('unsupported')

// A double-quoted, single-quoted or plain scalar, in that capture order.
const quoted = String.raw`"((?:[^"\\\n]|\\.)*)"|'((?:[^'\n]|'')*)'`

// A key and its colon. A plain key ends at the first colon that a space or the line end follows.
const keyPattern = new RegExp(String.raw`(?:${quoted}|([^\s'"?{}[\],#&*!|>%@\`][^\n]*?)) *:(?= |\r?$)`, 'my')

// A `$ref` key and its value, which ends before a comment and trailing spaces.
const refPattern = new RegExp(String.raw`\$ref["']? *: +(?:${quoted}|(\S[^\n]*?))(?= +#|[ \t\r]*$)`, 'gm')

/**
 * The text of a scalar that `keyPattern` or `refPattern` matched, with the length it has in the
 * source. `undefined` for a YAML escape that JSON does not have, such as `\x41`.
 */
function readScalar([, double, single, plain]: RegExpExecArray): { text: string; length: number } | undefined {
  if (plain !== undefined) return { text: plain, length: plain.length }
  if (single !== undefined) return { text: single.replaceAll("''", "'"), length: single.length + 2 }
  try {
    return { text: JSON.parse(`"${double}"`) as string, length: double!.length + 2 }
  } catch {
    return undefined
  }
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
 * node for every value. A mapping or a sequence is read the first time a pointer walks through it.
 */
function indexBlock(source: string) {
  const starts: Array<number> = []
  // Leading spaces per line, `-1` for a blank line, a comment and a document marker.
  const indents: Array<number> = []
  // Collections by the offset of their first entry.
  const maps = new Map<number, BlockMap>()
  const sequences = new Map<number, Array<number>>()
  let refs: Map<string, NonNullable<Range>> | undefined

  for (let start = 0, end = 0; end !== -1; start = end + 1) {
    let at = start
    while (source.charCodeAt(at) === 32) at++
    const code = source.charCodeAt(at)
    // NaN at the end of the text, then line feed, carriage return and `#`.
    const skipped = Number.isNaN(code) || code === 10 || code === 13 || code === 35 || source.startsWith('---', start) || source.startsWith('...', start)
    starts.push(start)
    indents.push(skipped ? -1 : at - start)
    end = source.indexOf('\n', at)
  }

  const isItem = (at: number) => source[at] === '-' && (at + 1 >= source.length || /\s/.test(source[at + 1]!))
  const skipSpaces = (at: number) => {
    let next = at
    while (source.charCodeAt(next) === 32) next++
    return next
  }
  // The first line after `line` that is not skipped and sits at `maxIndent` or shallower, `-1` when there is none.
  const nextLine = (line: number, maxIndent = Number.POSITIVE_INFINITY) => {
    for (let next = line + 1; next < indents.length; next++) {
      if (indents[next] !== -1 && indents[next]! <= maxIndent) return next
    }
    return -1
  }
  // Where `line` ends, without trailing spaces or a carriage return.
  const lineEnd = (line: number) => {
    let end = line + 1 < starts.length ? starts[line + 1]! - 1 : source.length
    while (end > starts[line]! && /[ \t\r]/.test(source[end - 1]!)) end--
    return end
  }
  const readKey = (at: number) => {
    keyPattern.lastIndex = at
    const match = keyPattern.exec(source)
    const key = match && readScalar(match)
    return key ? { text: key.text, end: at + key.length, value: skipSpaces(at + match![0].length) } : undefined
  }
  // The lines that hold the entries of the collection at `node`. A deeper line belongs to an entry, a shallower one ends the collection.
  function* entryLines(node: BlockNode): Generator<number> {
    yield node.line
    for (let line = node.line + 1; line < indents.length; line++) {
      const indent = indents[line]!
      if (indent === -1 || indent > node.column) continue
      if (indent < node.column) return
      yield line
    }
  }
  const mapEntries = (node: BlockNode): BlockMap => {
    const entries = new Map<string, BlockEntry>()
    let partial = false
    for (const line of entryLines(node)) {
      const start = starts[line]! + node.column
      // Items of a sequence that sits at its key's own indent.
      if (isItem(start)) continue
      const key = readKey(start)
      if (!key) {
        partial = true
        continue
      }
      // A duplicate key keeps its first range, like `findPointer`.
      if (!entries.has(key.text)) entries.set(key.text, { line, start, end: key.end, value: key.value })
    }
    return { entries, partial }
  }
  const sequenceLines = (node: BlockNode) => {
    const lines: Array<number> = []
    for (const line of entryLines(node)) {
      // A key at the items' indent ends a sequence that sits at its own key's indent.
      if (!isItem(starts[line]! + node.column)) break
      lines.push(line)
    }
    return lines
  }
  // The collection that the value at `at` holds, `undefined` for a scalar. `column` is where the entry itself sits. Only a
  // sequence item (`inline`) opens a collection on its own line, and only a mapping value lets a sequence sit at the entry's own indent.
  const nestedNode = ({
    line,
    column,
    at,
    inline,
  }: {
    line: number
    column: number
    at: number
    inline: boolean
  }): BlockNode | typeof unsupported | undefined => {
    if (at < lineEnd(line) && source[at] !== '#') {
      if ('{[&*!'.includes(source[at]!)) return unsupported
      return inline && (isItem(at) || readKey(at)) ? { line, column: at - starts[line]! } : undefined
    }
    const next = nextLine(line)
    if (next === -1) return undefined
    const indent = indents[next]!
    if (indent > column) return { line: next, column: indent }
    return !inline && indent === column && isItem(starts[next]! + column) ? { line: next, column } : undefined
  }
  const rootNode = (): BlockNode | typeof unsupported | undefined => {
    const line = nextLine(-1)
    if (line === -1) return undefined
    const column = indents[line]!
    return '{['.includes(source[starts[line]! + column]!) ? unsupported : { line, column }
  }

  return {
    /**
     * Walks a JSON pointer through block mappings and sequences, like `findPointer`. `undefined` when the walk meets syntax
     * the index does not read, so the caller parses the document instead.
     */
    find(pointer: string): { range: Range } | undefined {
      let node = rootNode()
      let range: Range

      for (const token of pointer.replace(/^#/, '').split('/').slice(1).map(unescapePointerToken)) {
        if (node === unsupported) return undefined
        if (!node) return { range: undefined }
        const collection = node
        const { column } = collection
        const first = starts[collection.line]! + column

        if (isItem(first)) {
          const line = memo(sequences, first, () => sequenceLines(collection))[Number(token)]
          if (line === undefined) return { range: undefined }
          const content = skipSpaces(starts[line]! + column + 1)
          node = nestedNode({ line, column, at: content, inline: true })
          // The item runs to the line before the next one at its own indent or shallower.
          const after = nextLine(line, column)
          let last = (after === -1 ? indents.length : after) - 1
          while (indents[last] === -1) last--
          // An item whose collection opens on the next line starts there.
          const start = content >= lineEnd(line) && typeof node === 'object' ? starts[node.line]! + node.column : content
          range = { start, end: lineEnd(last) }
          continue
        }

        const { entries, partial } = memo(maps, first, () => mapEntries(collection))
        const entry = entries.get(token)
        if (!entry) return partial ? undefined : { range: undefined }
        range = { start: entry.start, end: entry.end }
        node = nestedNode({ line: entry.line, column, at: entry.value, inline: false })
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
          const value = readScalar(match)
          const end = match.index + match[0].length
          if (value && !refs.has(value.text)) refs.set(value.text, { start: end - value.length, end })
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
