import { URLPath } from './URLPath.ts'

describe('URLPath', () => {
  const path = new URLPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')
  const simplePath = new URLPath('/user/{userID}')
  test('if templateStrings returns correct format', () => {
    expect(path.template).toBe('`/user/${userId}/monetary-account/${monetaryAccountId}/whitelist-sdd/${itemId}`')
    expect('/pet/findByStatus').toBe('/pet/findByStatus')
  })

  test('if templateStrings returns correct format with replacer', () => {
    expect(simplePath.toTemplateString((item) => `unref(${item})`)).toBe('`/user/${unref(userId)}`')
    expect(simplePath.template).toBe('`/user/${userId}`')
    expect(URLPath.toTemplateString(simplePath.path)).toBe('`/user/${userId}`')
  })

  test('if URL path returns the correct format', () => {
    expect(path.URL).toBe('/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId')
  })

  test('if params is getting returned', () => {
    expect(simplePath.params).toStrictEqual({ userId: 'userId' })
    expect(simplePath.getParams()).toStrictEqual({ userId: 'userId' })
    expect(URLPath.getParams(simplePath.path)).toStrictEqual({ userId: 'userId' })
  })
  test('if object is getting returned', () => {
    expect(simplePath.object).toStrictEqual({ url: '/user/:userID', params: { userId: 'userId' } })
    expect(simplePath.toObject()).toStrictEqual({ url: '/user/:userID', params: { userId: 'userId' } })
    expect(simplePath.toObject({ type: 'template' })).toStrictEqual({ url: '`/user/${userId}`', params: { userId: 'userId' } })
    // const userId = 2
    expect(simplePath.toObject({ type: 'template', stringify: true })).toStrictEqual('{url:`/user/${userId}`,params:{userId:userId}}')

    expect(URLPath.toObject(simplePath.path)).toStrictEqual({ url: '/user/:userID', params: { userId: 'userId' } })

    expect(URLPath.toObject('/test')).toStrictEqual({ url: '/test', params: undefined })
    expect(URLPath.toObject('/test', { type: 'template', stringify: true })).toStrictEqual('{url:`/test`}')
  })
})
