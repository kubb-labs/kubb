import type { CreateUserMutationRequest, CreateUserMutationResponse } from "../../models/ts/userController/CreateUser.ts";

export function createUser(data?: CreateUserMutationRequest): Cypress.Chainable<CreateUserMutationResponse> {
  return cy.request('post', '/user', data).then((res: Cypress.Response<CreateUserMutationResponse>) => res.body)
}