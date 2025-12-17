import type { DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser.ts'

export function deleteUser(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<DeleteUserMutationResponse> {
  return cy
    .request({
      method: 'delete',
      url: '/user/:username',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<DeleteUserMutationResponse>) => res.body)
}
