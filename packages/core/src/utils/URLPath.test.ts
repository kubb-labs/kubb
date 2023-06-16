import { URLPath } from './URLPath.ts'

describe('URLPath', () => {
  const path = new URLPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')
  test('if templateStrings returns correct format', () => {
    expect(path.template).toBe('`/user/${userId}/monetary-account/${monetaryAccountId}/whitelist-sdd/${itemId}`')
    expect('/pet/findByStatus').toBe('/pet/findByStatus')
  })

  test('if URL path returns the correct format', () => {
    expect(path.URL).toBe('/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId')
  })
})
