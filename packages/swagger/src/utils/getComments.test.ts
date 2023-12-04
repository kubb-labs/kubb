import { getComments } from './getComments.ts'

import type { Operation } from '../oas/index.ts'

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
    ).toStrictEqual(['@description description', '@summary summary', '@link /pets/:id', '@deprecated'])
  })
})
