/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: test case */

import { describe, expect, test } from 'vitest'
import { Url } from './Url.ts'

describe('Url.toTemplateString', () => {
  test('renders path params as template literal interpolations', () => {
    expect(Url.toTemplateString('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '`/user/${userID}/monetary-account/${monetaryAccountID}/whitelist-sdd/${itemId}`',
    )
    expect(Url.toTemplateString('/user/{user_id}')).toBe('`/user/${user_id}`')
  })

  test('applies the replacer to each param', () => {
    expect(Url.toTemplateString('/user/{userID}', { replacer: (item) => `unref(${item})` })).toBe('`/user/${unref(userID)}`')
    expect(Url.toTemplateString('/user/{userID}')).toBe('`/user/${userID}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(Url.toTemplateString('/user/{userID}', { prefix: 'https://api' })).toBe('`https://api/user/${userID}`')
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    // OpenAPI supports Google-style custom methods: /pet/{petId}:search
    // The :search suffix must NOT be treated as a route parameter
    expect(Url.toTemplateString('/pet/{petId}:search')).toBe('`/pet/${petId}:search`')
  })
})

describe('Url.toPath', () => {
  test('converts path params to Express-style colon syntax', () => {
    expect(Url.toPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '/user/:userID/monetary-account/:monetary-accountID/whitelist-sdd/:itemId',
    )
    expect(Url.toPath('/pet/{petId}:search')).toBe('/pet/:petId:search')
  })
})

describe('Url.toSafeTemplate', () => {
  test('rewrites param names while keeping braces', () => {
    expect(Url.toSafeTemplate('/user/{monetary-account-id}')).toBe('/user/{monetaryAccountId}')
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    expect(Url.toSafeTemplate('/pet/{petId}:search')).toBe('/pet/{petId}:search')
  })
})

describe('Url.toGroupedTemplateString', () => {
  test('reads each param off a grouped path object', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}')).toBe('`/pet/${path.petId}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}', { prefix: 'https://api' })).toBe('`https://api/pet/${path.petId}`')
  })
})

describe('Url.toObject', () => {
  test('returns url and params for an Express path', () => {
    expect(Url.toObject('/user/{userID}')).toStrictEqual({
      url: '/user/:userID',
      params: { userID: 'userID' },
    })
  })

  test('returns url as a template literal when requested', () => {
    expect(Url.toObject('/user/{userID}', { type: 'template' })).toStrictEqual({
      url: '`/user/${userID}`',
      params: { userID: 'userID' },
    })
  })

  test('serializes to a string expression when stringify is set', () => {
    expect(Url.toObject('/user/{userID}', { type: 'template', stringify: true })).toBe('{url:`/user/${userID}`,params:{userID:userID}}')
  })

  test('returns null params and omits them when the path has none', () => {
    expect(Url.toObject('/test')).toStrictEqual({
      url: '/test',
      params: null,
    })
    expect(Url.toObject('/test', { type: 'template', stringify: true })).toMatchInlineSnapshot(`"{url:\`/test\`,params:null}"`)
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    expect(Url.toObject('/pet/{petId}:search')).toStrictEqual({
      url: '/pet/:petId:search',
      params: { petId: 'petId' },
    })
  })
})
