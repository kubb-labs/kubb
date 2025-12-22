import type { GetUserByNameQueryResponse, GetUserByNamePathParams } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByName(
  username: GetUserByNamePathParams['username'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<GetUserByNameQueryResponse> {
  return cy
    .request<GetUserByNameQueryResponse>({
      method: 'get',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
