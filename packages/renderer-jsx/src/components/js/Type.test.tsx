import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { File } from '../File.tsx'
import { Type } from './Type.tsx'

describe('Type', () => {
  it('keeps a name that starts with a lowercase letter', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="pet_owner" isExportable>
          <Type export name="pet_owner">
            {'string'}
          </Type>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes?.[0]).toMatchObject({ kind: 'Type', name: 'pet_owner' })
  })
})
