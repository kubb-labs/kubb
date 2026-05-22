import { jsxRenderer } from '../createRenderer.tsx'
import type { KubbReactNode } from '../types.ts'
import { File } from './File.tsx'

/**
 * Render a markdown JSX subtree and return the text emitted by the first
 * `<kubb-source>` block. Used by the markdown component tests as a uniform
 * assertion target — `expect(await renderToText(<Heading>…</Heading>)).toBe(…)`.
 */
export async function renderToText(children: KubbReactNode): Promise<string | undefined> {
  const renderer = jsxRenderer()
  await renderer.render(
    <File baseName="post.md" path="src/post.md">
      {children}
    </File>,
  )
  const nodes = renderer.files[0]?.sources[0]?.nodes as Array<{ kind: string; value?: string }> | undefined
  renderer.unmount()
  return nodes?.find((node) => node.kind === 'Text')?.value
}
