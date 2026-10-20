import type { Adapter } from '@kubb/core'
import * as yaml from 'yaml'

type Range = ReturnType<NonNullable<Adapter['locate']>>

// Diagnostics of one run share a source, so the parsed document is kept for the next call.
let cached: { source: string; document: yaml.Document } | undefined

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export const locate: NonNullable<Adapter['locate']> = (source, location) => {
  if (cached?.source !== source) cached = { source, document: yaml.parseDocument(source) }
  const { document } = cached

  function findPointer(pointer: string): Range {
    const tokens = pointer
      .replace(/^#/, '')
      .split('/')
      .slice(1)
      .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'))
    let node: unknown = document.contents
    let range: Range
    for (const token of tokens) {
      if (yaml.isMap(node)) {
        const pair = node.items.find((item) => yaml.isScalar(item.key) && String(item.key.value) === token)
        if (!pair || !yaml.isScalar(pair.key) || !pair.key.range) return undefined
        range = { start: pair.key.range[0], end: pair.key.range[1] }
        node = pair.value
        continue
      }
      if (yaml.isSeq(node)) {
        const item = node.items[Number(token)]
        if (!yaml.isNode(item) || !item.range) return undefined
        range = { start: item.range[0], end: item.range[1] }
        node = item
        continue
      }
      return undefined
    }
    return range
  }

  function findRefUsage(ref: string): Range {
    let range: Range
    yaml.visit(document, {
      Pair(_, pair) {
        if (!yaml.isScalar(pair.key) || pair.key.value !== '$ref' || !yaml.isScalar(pair.value) || pair.value.value !== ref || !pair.value.range) return
        range = { start: pair.value.range[0], end: pair.value.range[1] }
        return yaml.visit.BREAK
      },
    })
    return range
  }

  if (!('pointer' in location)) return undefined
  return findPointer(location.pointer) ?? ('ref' in location && location.ref ? findRefUsage(location.ref) : undefined)
}
