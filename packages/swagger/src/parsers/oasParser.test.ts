import pathParser from 'path'

import { oasPathParser } from './oasParser'

describe('oasParser', () => {
  const path = pathParser.resolve(__dirname, '../../mocks/petStore.yaml')

  test('check if oas and title is defined based on a Swagger(v3) file', async () => {
    const oas = await oasPathParser(path)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })
})
