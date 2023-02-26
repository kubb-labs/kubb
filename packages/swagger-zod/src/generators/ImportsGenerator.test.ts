import pathParser from 'path'

import { oasPathParser } from '@kubb/swagger'
import { format } from '@kubb/core'
import type { OpenAPIV3 } from '@kubb/swagger'
import { print } from '@kubb/ts-codegen'

import { ImportsGenerator } from './ImportsGenerator'
import { ZodGenerator } from './ZodGenerator'

describe('ImportsGenerator', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/petStoreRef.yaml')

  test('generate type for Pets with custom fileResolver', async () => {
    const oas = await oasPathParser(path)
    const typeGenerator = new ZodGenerator(oas, { withJSDocs: false })
    const importsGenerator = new ImportsGenerator({ fileResolver: (name) => Promise.resolve(`#models/${name}`) })

    const schemas = oas.getDefinition().components?.schemas
    const node = typeGenerator.build(schemas?.Pets as OpenAPIV3.SchemaObject, 'Pets')

    const importsNode = await importsGenerator.build([
      {
        refs: typeGenerator.refs,
        name: 'Pets',
        sources: node,
      },
    ])

    const output = importsNode && print([...importsNode], undefined) + node

    expect(output).toBeDefined()
    expect(format(output!)).toEqual(
      format(`
      import { Pet } from "#models/Pet";
      export const Pets = z.array(Pet);
    `)
    )
  })
})
