import { describe, expect, it } from 'vitest'
import { File } from './components/File.tsx'
import { createRenderer } from './createRenderer.tsx'

describe('createRenderer', () => {
  it('should render and collect files', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="pet.ts" path="src/models/pet.ts">
        <File.Source name="Pet" isExportable isIndexable>
          {'export type Pet = { id: number; name: string }'}
        </File.Source>
      </File>,
    )

    expect(renderer.files.length).toBe(1)
    expect(renderer.files[0]?.baseName).toBe('pet.ts')
    renderer.unmount()
  })

  it('should propagate render errors', async () => {
    const renderer = createRenderer()
    function BadComponent(): never {
      throw new Error('render error')
    }
    await expect(
      renderer.render(
        <File baseName="bad.ts" path="src/bad.ts">
          <BadComponent />
        </File>,
      ),
    ).rejects.toThrow('render error')
    renderer.unmount()
  })
})
