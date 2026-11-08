import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../../jsxRenderer.ts'
import { File } from '../File.tsx'
import { Type } from './Type.tsx'

describe('Type', () => {
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
