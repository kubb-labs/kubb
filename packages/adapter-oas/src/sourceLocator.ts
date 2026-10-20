import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

// Diagnostics of one run share a source, so the parsed document is kept for the next call.
const cache = new Map<string, yaml.Document>()

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

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (!('pointer' in location)) return undefined
  if (!cache.has(source)) {
    cache.clear()
    cache.set(source, yaml.parseDocument(source))
  }
  const document = cache.get(source)!
  return findPointer(document, location.pointer) ?? ('ref' in location && location.ref ? findRefUsage(document, location.ref) : undefined)
}
