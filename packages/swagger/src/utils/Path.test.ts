/* eslint-disable no-template-curly-in-string */
import { Path } from './Path.ts'

describe('Path', () => {
  const path = new Path('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')
  test('if templateStrings returns correct format', async () => {
    expect(path.template).toBe('`/user/${userId}/monetary-account/${monetaryAccountId}/whitelist-sdd/${itemId}`')
    expect('/pet/findByStatus').toBe('/pet/findByStatus')
  })

  test('if URL path returns the correct format', async () => {
    expect(path.URL).toBe('/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId')
  })
})
