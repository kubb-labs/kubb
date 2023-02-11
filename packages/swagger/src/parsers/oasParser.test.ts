import pathParser from 'path'

import { oasPathParser } from './oasParser'

describe('oasParser', () => {
  const petStoreV3 = pathParser.resolve(__dirname, '../../mocks/petStore.yaml')
  const petStoreV2 = pathParser.resolve(__dirname, '../../mocks/petStoreV2.json')

  test('check if oas and title is defined based on a Swagger(v3) file', async () => {
    const oas = await oasPathParser(petStoreV3)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })

  test('check if oas and title is defined based on a Swagger(v2) file', async () => {
    const oas = await oasPathParser(petStoreV2)

    expect(oas).toBeDefined()
    expect(oas.api?.info.title).toBe('Swagger Petstore')
  })
})
