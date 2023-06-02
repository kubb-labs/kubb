import { getParams } from './getParams.js'

describe('getParams', () => {
  test('if operation returns a string with parameters', async () => {
    expect(
      getParams({
        name: 'Pet',
        schema: {
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
        },
      })
    ).toEqual('name, age')
  })

  test('if operation returns a string with typed parameters', async () => {
    expect(
      getParams(
        {
          name: 'Pet',
          schema: {
            properties: {
              name: {
                type: 'string',
              },
              age: {
                type: 'number',
              },
            },
          },
        },
        { typed: true }
      )
    ).toEqual('name: Pet["name"], age: Pet["age"]')
  })
})
