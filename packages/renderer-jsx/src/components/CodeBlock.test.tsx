import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { CodeBlock } from './CodeBlock.tsx'
import { File } from './File.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('CodeBlock', () => {
  it('wraps children in fenced code with a language tag', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock lang="typescript">{'const pet = { id: 1 }'}</CodeBlock>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('```typescript\nconst pet = { id: 1 }\n```')
    renderer.unmount()
  })

  it('omits the language tag when none is provided', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <CodeBlock>{'echo hi'}</CodeBlock>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('```\necho hi\n```')
    renderer.unmount()
  })
})
