/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: test case */

import { describe, expect, test } from 'vitest'
import { Url } from './Url.ts'

describe('Url.toPath', () => {
  test('converts path params to Express-style colon syntax', () => {
    expect(Url.toPath('/user/{userID}/monetary-account/{monetary-accountID}/whitelist-sdd/{itemId}')).toBe(
      '/user/:userID/monetary-account/:monetaryAccountID/whitelist-sdd/:itemId',
    )
    expect(Url.toPath('/pet/{petId}:search')).toBe('/pet/:petId:search')
  })

  test('camelCases a hyphenated param name so path-to-regexp accepts it', () => {
    // path-to-regexp (used by MSW/Express) treats a hyphen as terminating the param name,
    // so `:point-id` parses as param `point` followed by literal `-id`
    expect(Url.toPath('/point/{point-id}')).toBe('/point/:pointId')
  })

  test('strips a leading `$` so path-to-regexp accepts the param name', () => {
    expect(Url.toPath('/things/{$id}')).toBe('/things/:Id')
  })

  test('deduplicates param names that normalize to the same identifier', () => {
    // `group-id` and `group.id` both camelCase to `groupId`; the second occurrence gets a
    // counter suffix so path-to-regexp never sees two identically named captures, and the
    // literal `.json` suffix is preserved
    expect(Url.toPath('/groups/{group-id}/{group.id}.json')).toBe('/groups/:groupId/:groupId2.json')
  })
})

describe('Url.toGroupedTemplateString', () => {
  test('reads each param off a grouped path object through dot access when the name is a valid identifier', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}')).toBe('`/pet/${path.petId}`')
  })

  test('falls back to bracket access for a non-identifier param name, unchanged', () => {
    expect(Url.toGroupedTemplateString('/user/{monetary-account-id}')).toBe('`/user/${path["monetary-account-id"]}`')
  })

  test('prepends the prefix inside the literal', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}', { prefix: 'https://api' })).toBe('`https://api/pet/${path.petId}`')
  })

  test('preserves a colon-suffix custom method (e.g. :search)', () => {
    expect(Url.toGroupedTemplateString('/pet/{petId}:search')).toBe('`/pet/${path.petId}:search`')
  })
})
