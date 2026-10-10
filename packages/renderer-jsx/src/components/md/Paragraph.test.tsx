import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.tsx'
import { File } from '../File.tsx'
import { Paragraph } from './Paragraph.tsx'

function firstValue(renderer: ReturnType<typeof jsxRenderer>): string | undefined {
  return (renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value
}

describe('Paragraph', () => {
  it('returns the body text verbatim', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
      </File>,
    )

    expect(firstValue(renderer)).toBe('A pet object with `id` and `name` fields.')
  })
})
