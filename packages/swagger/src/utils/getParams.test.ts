import { getParams } from './getParams.ts'

describe('getParams', () => {
  test("if getParams returns '' when no properties are defined", async () => {
    expect(
      getParams({
        name: 'Pet',
        schema: {
          properties: undefined,
        },
      })
    ).toBe('')
  })
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
    ).toBe('name, age')
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
    ).toBe('name: Pet["name"], age: Pet["age"]')
  })
})
