import { getReference } from './getReference.ts'

describe('getReference', () => {
  test('if reference if returned', () => {
    try {
      getReference({}, '#/components/schemas/Category')
    } catch (e) {
      expect(e).toBeDefined()
    }

    expect(
      getReference(
        {
          components: {
            schemas: {
              Category: { properties: { name: { type: 'string' } } },
            },
          },
        },
        '#/components/schemas/Category'
      )
    ).toStrictEqual({ properties: { name: { type: 'string' } } })
  })
})
