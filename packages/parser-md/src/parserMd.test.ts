import { createFile, createSource, createText } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { parserMd } from './parserMd.ts'

describe('parserMd', () => {
  it('joins markdown source blocks separated by blank lines', () => {
    const file = createFile({
      baseName: 'post.md',
      path: '/post.md',
      sources: [createSource({ nodes: [createText('# Hello')] }), createSource({ nodes: [createText('Body paragraph.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd.parse(file)).toBe('# Hello\n\nBody paragraph.')
  })

  it('emits frontmatter from file meta', () => {
    const file = createFile<{ frontmatter?: Record<string, unknown> }>({
      baseName: 'post.md',
      path: '/post.md',
      meta: { frontmatter: { title: 'Hi', tags: ['a', 'b'] } },
      sources: [createSource({ nodes: [createText('Body.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd.parse(file)).toBe('---\ntitle: Hi\ntags:\n  - a\n  - b\n---\n\nBody.')
  })

  it('omits frontmatter when meta is empty', () => {
    const file = createFile({
      baseName: 'post.md',
      path: '/post.md',
      sources: [createSource({ nodes: [createText('Body only.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd.parse(file)).toBe('Body only.')
  })

  it('respects banner and footer', () => {
    const file = createFile({
      baseName: 'post.md',
      path: '/post.md',
      banner: '<!-- generated -->',
      footer: '<!-- end -->',
      sources: [createSource({ nodes: [createText('Body.')] })],
      imports: [],
      exports: [],
    })

    expect(parserMd.parse(file)).toBe('<!-- generated -->\n\nBody.\n\n<!-- end -->')
  })

  it('returns empty string when nothing to render', () => {
    const file = createFile({
      baseName: 'post.md',
      path: '/post.md',
      sources: [],
      imports: [],
      exports: [],
    })

    expect(parserMd.parse(file)).toBe('')
  })
})

describe('parserMd.print', () => {
  it('serialises a plain object as a YAML frontmatter envelope', () => {
    expect(parserMd.print({ title: 'Hi' })).toBe('---\ntitle: Hi\n---')
  })

  it('returns an empty string for an empty object', () => {
    expect(parserMd.print({})).toBe('')
  })

  it('passes string fragments through and joins with blank lines', () => {
    expect(parserMd.print('# Hello', 'World')).toBe('# Hello\n\nWorld')
  })

  it('mixes frontmatter objects and markdown strings', () => {
    expect(parserMd.print({ title: 'Hi' }, '# Hello')).toBe('---\ntitle: Hi\n---\n\n# Hello')
  })

  it('skips falsy fragments', () => {
    expect(parserMd.print('# Hello', '', undefined as unknown as string, null as unknown as string, 'World')).toBe('# Hello\n\nWorld')
  })
})
