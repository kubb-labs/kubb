import type { Operation } from '@kubb/oas'
import { describe, expect, test } from 'vitest'
import { getComments } from './getComments.ts'

describe('getComments', () => {
  test('if comments get added to the result', () => {
    expect(
      getComments({
        getDescription() {
          return 'description'
        },
        getSummary() {
          return 'summary'
        },
        path: '/pets/{id}',
        isDeprecated() {
          return true
        },
      } as Operation),
    ).toStrictEqual(['@description description', '@summary summary', '{@link /pets/:id}', '@deprecated'])
  })

  test('should handle multi-line descriptions with newlines', () => {
    expect(
      getComments({
        getDescription() {
          return 'First line of description\nSecond line of description\nThird line of description'
        },
        getSummary() {
          return 'summary'
        },
        path: '/pets/{id}',
        isDeprecated() {
          return false
        },
      } as Operation),
    ).toStrictEqual([
      '@description First line of description',
      'Second line of description',
      'Third line of description',
      '@summary summary',
      '{@link /pets/:id}',
    ])
  })

  test('should handle multi-line descriptions with CRLF', () => {
    expect(
      getComments({
        getDescription() {
          return 'First line\r\nSecond line'
        },
        getSummary() {
          return undefined
        },
        path: undefined,
        isDeprecated() {
          return false
        },
      } as unknown as Operation),
    ).toStrictEqual(['@description First line', 'Second line'])
  })

  test('should handle multi-line summary', () => {
    expect(
      getComments({
        getDescription() {
          return undefined
        },
        getSummary() {
          return 'First line of summary\nSecond line of summary'
        },
        path: undefined,
        isDeprecated() {
          return false
        },
      } as unknown as Operation),
    ).toStrictEqual(['@summary First line of summary', 'Second line of summary'])
  })
})
