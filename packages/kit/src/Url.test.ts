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

  test('strips a leading `$` so path-to-regexp accepts the param name', () => {
    expect(Url.toPath('/things/{$id}')).toBe('/things/:Id')
  })

  test('deduplicates param names that normalize to the same identifier', () => {
    // `group-id` and `group.id` both camelCase to `groupId`; the second occurrence gets a
    // counter suffix so path-to-regexp never sees two identically named captures, and the
    // literal `.json` suffix is preserved
    expect(Url.toPath('/groups/{group-id}/{group.id}.json')).toBe('/groups/:groupId/:groupId2.json')
  })

  test('never reuses a name that already ends in a counter', () => {
    expect(Url.toPath('/{group-id}/{group.id}/{groupId2}')).toBe('/:groupId/:groupId2/:groupId22')
    expect(Url.toPath('/{groupId2}/{group-id}/{group.id}')).toBe('/:groupId2/:groupId/:groupId3')
  })
})

describe('Url.toParamNames', () => {
  test('maps each placeholder to a camelCase identifier', () => {
    expect(Url.toParamNames('/stores/{store-id}/pets/{pet-id}')).toEqual(
      new Map([
        ['store-id', 'storeId'],
        ['pet-id', 'petId'],
      ]),
    )
    expect(Url.toParamNames('/groups/{group-id}/{group.id}.json')).toEqual(
      new Map([
        ['group-id', 'groupId'],
        ['group.id', 'groupId2'],
      ]),
    )
  })

  test('camelCases names that are already identifiers', () => {
    expect([...Url.toParamNames('/{pet_id}/{PetId2}/{$id}/{userID}').values()]).toEqual(['petId', 'petId2', 'id', 'userID'])
  })

  test('gives distinct placeholders distinct names that Url.toPath keeps as they are', () => {
    expect([...Url.toParamNames('/{a-b}/{a-b}/{a.b}').values()]).toEqual(['aB', 'aB3'])
    for (const path of ['/{group-id}/{group.id}/{groupId2}', '/{pet_id}/{pet-id}']) {
      const names = Url.toParamNames(path)
      const renamed = path.replace(/\{([^}]+)\}/g, (_match, name: string) => `{${names.get(name)}}`)
      expect(new Set(names.values()).size).toBe(names.size)
      expect(Url.toPath(renamed)).toBe(renamed.replace(/\{([^}]+)\}/g, ':$1'))
    }
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
