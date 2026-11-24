import { describe, expect, it } from 'vitest'
import { nodeTypes, parseExpression, parseSource } from './ast.ts'

describe('parseSource', () => {
  it('returns the program and comments of a TypeScript module', () => {
    const parsed = parseSource(`// kubb\nexport default (defineConfig({}) satisfies object)\n`)

    expect('reason' in parsed).toBe(false)
    if ('reason' in parsed) return
    expect(parsed.comments.map((comment) => comment.value)).toStrictEqual([' kubb'])
    expect(parsed.program.body[0]?.type).toBe(nodeTypes.exportDefaultDeclaration)
  })

  it('returns a reason instead of throwing on a syntax error', () => {
    expect(parseSource('export default {')).toStrictEqual({ reason: 'the config file could not be parsed' })
  })
})

describe('parseExpression', () => {
  it('reads a single expression without its parentheses', () => {
    expect(parseExpression(`(pluginTs({ output: './gen' }))`)?.type).toBe(nodeTypes.callExpression)
  })

  it.each([
    { title: 'two statements', source: 'a()\nb()' },
    { title: 'a declaration', source: 'const a = 1' },
    { title: 'a syntax error', source: 'pluginTs({' },
  ])('returns undefined for $title', ({ source }) => {
    expect(parseExpression(source)).toBeUndefined()
  })
})
