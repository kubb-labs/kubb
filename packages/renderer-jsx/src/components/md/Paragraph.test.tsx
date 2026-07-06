import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../createRenderer.tsx'
import { File } from '../File.tsx'
import { Paragraph } from './Paragraph.tsx'

describe('Paragraph', () => {
  it('renders body text verbatim', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Paragraph>{'A pet object with `id` and `name` fields.'}</Paragraph>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(
      `"A pet object with \`id\` and \`name\` fields."`,
    )
  })
})
