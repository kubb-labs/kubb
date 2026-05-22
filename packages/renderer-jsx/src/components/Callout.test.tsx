import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { Callout } from './Callout.tsx'
import { File } from './File.tsx'

describe('Callout', () => {
  it('renders a tip callout without a title', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe(
      '> [!TIP]\n> Run `kubb start --watch` to keep the generator hot.',
    )
    renderer.unmount()
  })

  it('renders a warning callout with a title and multi-line body', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="warning" title="Heads up">
          {'body line 1\nline 2'}
        </Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe('> [!WARNING] Heads up\n> body line 1\n> line 2')
    renderer.unmount()
  })

  it('quotes blank lines as a bare `>`', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="note">{'first paragraph\n\nsecond paragraph'}</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe('> [!NOTE]\n> first paragraph\n>\n> second paragraph')
    renderer.unmount()
  })

  it.each([
    ['tip', 'TIP'],
    ['note', 'NOTE'],
    ['important', 'IMPORTANT'],
    ['warning', 'WARNING'],
    ['caution', 'CAUTION'],
  ] as const)('uses the %s label for type %s', async (type, label) => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type={type}>body</Callout>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toBe(`> [!${label}]\n> body`)
    renderer.unmount()
  })
})
