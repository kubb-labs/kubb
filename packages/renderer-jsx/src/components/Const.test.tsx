import { describe, expect, it } from 'vitest'
import { createRenderer } from '../createRenderer.tsx'
import { Const } from './Const.tsx'
import { File } from './File.tsx'

describe('Const', () => {
  it('should emit a Const node', async () => {
    const renderer = createRenderer()
    await renderer.render(
      <File baseName="config.ts" path="src/config.ts">
        <File.Source name="BASE_URL" isExportable>
          <Const export name="BASE_URL">
            {'"https://api.example.com"'}
          </Const>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes?.[0]?.kind).toBe('Const')
    renderer.unmount()
  })
})
