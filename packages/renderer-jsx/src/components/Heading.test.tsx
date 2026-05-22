import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Heading } from './Heading.tsx'

describe('Heading', () => {
  it('renders an ATX heading with the requested level', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Heading level={2}>Installation</Heading>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`"## Installation"`)
    renderer.unmount()
  })
})
