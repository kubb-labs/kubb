import type { DeleteUserPathParams, DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser.ts'

export function deleteUser(
  username: DeleteUserPathParams['username'],
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeleteUserMutationResponse> {
  return cy
    .request<DeleteUserMutationResponse>({
      method: 'DELETE',
      url: `/user/${username}`,
      ...options,
    })
    .then((res) => res.body)
}
