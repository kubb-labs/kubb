import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from "../../models/ts/userController/CreateUsersWithListInput.ts";

export function createUsersWithListInput(data?: CreateUsersWithListInputMutationRequest): Cypress.Chainable<CreateUsersWithListInputMutationResponse> {
  return cy.request('post', '/user/createWithList', data).then((res: Cypress.Response<CreateUsersWithListInputMutationResponse>) => res.body)
}