import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const mocks = path.resolve(import.meta.dirname, '../mocks')
// `withUrlRef.yaml` is left out: its `$ref` needs the network.
const fixtures = ['petStore.yaml', 'withDeepExternalRef.yaml', 'withExternalFileRef.yaml', 'withFragmentRef.yaml', 'phantom/main.yaml']

/**
 * Returns the JSON paths of values that do not survive `JSON.stringify`: functions, symbols,
 * bigints, non-finite numbers, class instances such as `Map` or `Set`, and cycles.
 */
function findNonPlainData(value: unknown, at = '$', seen = new Set<object>()): Array<string> {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || value === undefined) return []
  if (typeof value === 'number') return Number.isFinite(value) ? [] : [at]
  if (typeof value !== 'object') return [at]
  if (seen.has(value)) return [`${at} (cycle)`]

  const proto = Object.getPrototypeOf(value)
  if (!Array.isArray(value) && proto !== Object.prototype && proto !== null) return [`${at} (${proto?.constructor?.name})`]

  seen.add(value)
  const found = Object.entries(value).flatMap(([key, child]) => findNonPlainData(child, `${at}.${key}`, seen))
  seen.delete(value)
  return found
}

describe('the AST is plain data', () => {
  it.each(fixtures)('%s survives a JSON round trip', async (fixture) => {
    const node = await adapterOas({ validate: false }).parse({ type: 'path', path: path.join(mocks, fixture) })

    expect(findNonPlainData(node)).toStrictEqual([])
    expect(JSON.parse(JSON.stringify(node))).toEqual(node)
  })

  it.each(fixtures)('%s matches its golden AST', async (fixture) => {
    const node = await adapterOas({ validate: false }).parse({ type: 'path', path: path.join(mocks, fixture) })

    await expect(`${JSON.stringify(node, null, 2)}\n`).toMatchFileSnapshot(`__snapshots__/ast/${fixture.replace(/\.yaml$/, '').replaceAll('/', '-')}.json`)
  })

  it('flags values JSON cannot carry', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic

    expect(findNonPlainData({ a: new Map(), b: [() => {}], c: Number.NaN, d: cyclic })).toStrictEqual(['$.a (Map)', '$.b.0', '$.c', '$.d.self (cycle)'])
  })
})
