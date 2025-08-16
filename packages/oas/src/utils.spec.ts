import { merge, parse } from './utils.ts'

describe('utils', () => {
  test('merge of 2 oas documents', async () => {
    const documents = [
      `openapi: 3.0.0
info:
  title: Swagger Petstore
  version: 1.0.0
components:
  schemas:
    Point:
      type: object
      properties:
        x:
          type: number
        y:
          type: number
      required: [x, y]
`,
      `openapi: 3.0.0
info:
  title: Shapes
  version: 1.0.0
paths: {}
components:
  schemas:
    Square:
      type: object
      properties:
        topLeft:
          $ref: '#/components/schemas/Point'
        size:
          type: number
      required: [topLeft, size]`,
    ]
    const oas = await merge(documents)

    expect(oas).toBeDefined()
    expect(oas.document).toMatchSnapshot()
    expect(oas.api?.info.title).toBe('Shapes')
  })

  test('parse a simple oas document', async () => {
    const oas = await parse(
      `openapi: 3.0.0
info:
  title: Swagger Petstore
  version: 1.0.0
components:
  schemas:
    Point:
      type: object
      properties:
        x:
          type: number
        y:
          type: number
      required: [x, y]
`,
      { canBundle: false },
    )
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })
})
