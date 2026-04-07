import { describe, expect, it } from 'vitest'
import { createRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'
import { Function } from './Function.tsx'

describe('Function', () => {
  it('should emit a Function node', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="api.ts" path="src/api.ts">
        <File.Source name="getPet" isExportable>
          <Function export name="getPet" params="petId: string" returnType="string">{'return petId'}</Function>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('Function')
    renderer.unmount()
  })
})

describe('Function.Arrow', () => {
  it('should emit an ArrowFunction node', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="utils.ts" path="src/utils.ts">
        <File.Source name="double" isExportable>
          <Function.Arrow export name="double" params="n: number" returnType="number" singleLine>{'n * 2'}</Function.Arrow>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes[0]?.kind).toBe('ArrowFunction')
    renderer.unmount()
  })
})
