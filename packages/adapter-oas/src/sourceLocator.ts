import type { SourceLocator } from '@kubb/core'
import * as yaml from 'yaml'

/**
 * Maps OpenAPI JSON pointers and unresolved references to ranges in YAML or JSON source.
 */
export function createSourceLocator(source: string): SourceLocator {
  const document = yaml.parseDocument(source)

  function findPointer(pointer: string): ReturnType<SourceLocator> {
    const tokens = pointer
      .replace(/^#/, '')
      .split('/')
      .slice(1)
      .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'))
    let node: unknown = document.contents
    let range: ReturnType<SourceLocator>
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

  function findRefUsage(ref: string): ReturnType<SourceLocator> {
    let range: ReturnType<SourceLocator>
    yaml.visit(document, {
      Pair(_, pair) {
        if (!yaml.isScalar(pair.key) || pair.key.value !== '$ref' || !yaml.isScalar(pair.value) || pair.value.value !== ref || !pair.value.range) return
        range = { start: pair.value.range[0], end: pair.value.range[1] }
        return yaml.visit.BREAK
      },
    })
    return range
  }

  return (location) => {
    if (!('pointer' in location)) return undefined
    return findPointer(location.pointer) ?? ('ref' in location && location.ref ? findRefUsage(location.ref) : undefined)
  }
}
