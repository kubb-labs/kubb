import type { CreateUserMutationRequest, CreateUserMutationResponse } from '../../models/CreateUser.ts'

export function createUser(data?: CreateUserMutationRequest): Cypress.Chainable<CreateUserMutationResponse> {
  return cy.request('post', 'http://localhost:3000/user', data).then((res: Cypress.Response<CreateUserMutationResponse>) => res.body)
}
