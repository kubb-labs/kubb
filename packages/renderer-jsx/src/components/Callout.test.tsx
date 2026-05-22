import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { Callout } from './Callout.tsx'
import { File } from './File.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('Callout', () => {
  it('renders a tip callout without a title', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="tip">Run `kubb start --watch` to keep the generator hot.</Callout>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('> [!TIP]\n> Run `kubb start --watch` to keep the generator hot.')
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

    expect(firstSourceText(renderer)).toBe('> [!WARNING] Heads up\n> body line 1\n> line 2')
    renderer.unmount()
  })

  it('quotes blank lines as a bare `>`', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Callout type="note">{'first paragraph\n\nsecond paragraph'}</Callout>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('> [!NOTE]\n> first paragraph\n>\n> second paragraph')
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

    expect(firstSourceText(renderer)).toBe(`> [!${label}]\n> body`)
    renderer.unmount()
  })
})
