import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { firstValue } from './testing.ts'
import { Callout } from './Callout.tsx'
import { File } from '../File.tsx'

describe('Callout', () => {
  it('returns a header without a title when title is not set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>
      </File>,
    )

    expect(firstValue(renderer)).toBe('> [!TIP]\n> Run `kubb start --watch` to keep the generator hot.')
  })

  it('returns a titled header and quotes every body line when title is set', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="warning" title="Heads up">
          {'body line 1\nline 2'}
        </Callout>
      </File>,
    )

    expect(firstValue(renderer)).toBe('> [!WARNING] Heads up\n> body line 1\n> line 2')
  })

  it('returns a bare > for blank lines when the body has paragraphs', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="note">{'first paragraph\n\nsecond paragraph'}</Callout>
      </File>,
    )

    expect(firstValue(renderer)).toBe('> [!NOTE]\n> first paragraph\n>\n> second paragraph')
  })

  it.each([
    { type: 'important', label: 'IMPORTANT' },
    { type: 'caution', label: 'CAUTION' },
  ] as const)('returns a $label marker when type is $type', async ({ type, label }) => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type={type}>body</Callout>
      </File>,
    )

    expect(firstValue(renderer)).toBe(`> [!${label}]\n> body`)
  })
})
