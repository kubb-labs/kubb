import type { GetUserByNamePathParams, GetUserByNameResponseData } from '../../models/ts/userController/GetUserByName.ts'

export function getUserByName(
  username: GetUserByNamePathParams['username'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<GetUserByNameResponseData> {
  return cy
    .request<GetUserByNameResponseData>({
      method: 'get',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
