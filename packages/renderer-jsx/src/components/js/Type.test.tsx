import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.tsx'
import { File } from '../File.tsx'
import { Type } from './Type.tsx'

describe('Type', () => {
  it('returns a Type node with the name, export flag, and text children', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="PetId" isExportable>
          <Type export name="PetId">
            {'string | number'}
          </Type>
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]?.nodes?.[0]).toStrictEqual({
      kind: 'Type',
      name: 'PetId',
      export: true,
      JSDoc: undefined,
      nodes: [{ kind: 'Text', value: 'string | number' }],
    })
  })

  it('throws when name does not start with an uppercase letter', () => {
    const renderer = jsxRenderer()
    const renderPromise = renderer.render(
      <File baseName="types.ts" path="src/types.ts">
        <File.Source name="petId" isExportable>
          <Type export name="petId">
            {'string'}
          </Type>
        </File.Source>
      </File>,
    )
    return expect(renderPromise).rejects.toThrow('Name should start with a capital letter')
  })
})
