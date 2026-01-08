import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData } from '../../models/ts/userController/UpdateUser.ts'

export function updateUser(
  username: UpdateUserPathParams['username'],
  data?: UpdateUserRequestData,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<UpdateUserResponseData> {
  return cy
    .request<UpdateUserResponseData>({
      method: 'put',
      url: `/user/${username}`,
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
