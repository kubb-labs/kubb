import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/ts/userController/CreateUser.ts'

export function createUser(data?: CreateUserMutationRequest, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<CreateUserMutationResponse> {
  return cy
    .request({
      method: 'post',
      url: '/user',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<CreateUserMutationResponse>) => res.body)
}
