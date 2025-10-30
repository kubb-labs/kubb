import type { Operation } from '@kubb/oas'
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
})
