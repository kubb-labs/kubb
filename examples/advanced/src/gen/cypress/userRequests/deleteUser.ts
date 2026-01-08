import type { DeleteUserPathParams, DeleteUserResponseData } from '../../models/ts/userController/DeleteUser.ts'

export function deleteUser(username: DeleteUserPathParams['username'], options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<DeleteUserResponseData> {
  return cy
    .request<DeleteUserResponseData>({
      method: 'delete',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
