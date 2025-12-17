import type { GetUserByNameQueryResponse } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByName(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetUserByNameQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/user/:username',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<GetUserByNameQueryResponse>) => res.body)
}
