import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserMd } from './parserMd.ts'

describe('parserMd', () => {
  it('joins markdown source blocks separated by blank lines', () => {
    const file = ast.factory.createFile({
      baseName: 'post.md',
      path: '/post.md',
      sources: [
        ast.factory.createSource({ nodes: [ast.factory.createText('# Hello')] }),
        ast.factory.createSource({ nodes: [ast.factory.createText('Body paragraph.')] }),
      ],
      imports: [],
      exports: [],
    })

    expect(parserMd().parse(file)).toBe('# Hello\n\nBody paragraph.')
  })

  it('emits frontmatter from file meta', () => {
    const file = ast.factory.createFile<{ frontmatter?: Record<string, unknown> }>({
      baseName: 'post.md',
      path: '/post.md',
      meta: { frontmatter: { title: 'Hi', tags: ['a', 'b'] } },
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('Body.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd().parse(file)).toBe('---\ntitle: Hi\ntags:\n  - a\n  - b\n---\n\nBody.')
  })

  it('respects banner and footer', () => {
    const file = ast.factory.createFile({
      baseName: 'post.md',
      path: '/post.md',
      banner: '<!-- generated -->',
      footer: '<!-- end -->',
      sources: [ast.factory.createSource({ nodes: [ast.factory.createText('Body.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd().parse(file)).toBe('<!-- generated -->\n\nBody.\n\n<!-- end -->')
  })
})
