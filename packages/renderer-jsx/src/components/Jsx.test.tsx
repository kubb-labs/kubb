import { describe, expect, it } from 'vitest'
import { createRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Function } from './Function.tsx'
import { Jsx } from './Jsx.tsx'

describe('Jsx', () => {
  it('should emit a Jsx node inside a function body', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="Component.tsx" path="src/Component.tsx">
        <File.Source name="MyComponent" isExportable>
          <Function export name="MyComponent">
            <Jsx>{'return (<div>Hello</div>)'}</Jsx>
          </Function>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Function')
    renderer.unmount()
  })
})
