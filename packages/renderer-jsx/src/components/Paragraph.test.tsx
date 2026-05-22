import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Paragraph } from './Paragraph.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('Paragraph', () => {
  it('renders body text verbatim', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('A pet object with `id` and `name` fields.')
    renderer.unmount()
  })
})
