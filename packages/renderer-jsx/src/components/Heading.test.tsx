import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Heading } from './Heading.tsx'

function firstSourceText(renderer: { files: ReadonlyArray<{ sources: ReadonlyArray<{ nodes?: unknown }> }> }) {
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  return nodes?.find((node) => node.kind === 'Text')?.value
}

describe('Heading', () => {
  it('renders an ATX heading with the requested level', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="post.md" path="src/post.md">
        <Heading level={2}>Installation</Heading>
      </File>,
    )

    expect(firstSourceText(renderer)).toBe('## Installation')
    renderer.unmount()
  })
})
