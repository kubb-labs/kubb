import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { CodeBlock } from './CodeBlock.tsx'
import { File } from './File.tsx'

describe('CodeBlock', () => {
  it('wraps children in fenced code with a language tag', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock lang="typescript">{'const pet = { id: 1 }'}</CodeBlock>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "\`\`\`typescript
      const pet = { id: 1 }
      \`\`\`"
    `)
    renderer.unmount()
  })

  it('omits the language tag when none is provided', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock>{'echo hi'}</CodeBlock>
      </File>,
    )

    expect((renderer.files[0]?.sources[0]?.nodes?.[0] as { value?: string } | undefined)?.value).toMatchInlineSnapshot(`
      "\`\`\`
      echo hi
      \`\`\`"
    `)
    renderer.unmount()
  })
})
