import type { UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/ts/userController/UpdateUser.ts'

export function updateUser(data?: UpdateUserMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<UpdateUserMutationResponse> {
  return cy
    .request({
      method: 'put',
      url: '/user/:username',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<UpdateUserMutationResponse>) => res.body)
}
