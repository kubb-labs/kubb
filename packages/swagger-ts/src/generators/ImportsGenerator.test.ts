import pathParser from 'path'

import { oasPathParser } from '@kubb/swagger'
import type { OpenAPIV3 } from '@kubb/swagger'
import { print } from '@kubb/ts-codegen'

import { ImportsGenerator } from './ImportsGenerator'
import { TypeGenerator } from './TypeGenerator'

import { format } from '../../mocks/format'

describe('ImportsGenerator', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/petStoreRef.yaml')

  test('generate type for Pets with custom fileResolver', async () => {
    const oas = await oasPathParser(path)
    const typeGenerator = new TypeGenerator(oas, { withJSDocs: false, resolveName: ({ name }) => name })
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

    const output = importsNode && print([...importsNode, ...node], undefined)

    expect(output).toBeDefined()
    expect(format(output!)).toMatchInlineSnapshot(`
      "import type { Pet } from '#models/Pet'
      export type Pets = Pet[]
      "
    `)
  })
})
