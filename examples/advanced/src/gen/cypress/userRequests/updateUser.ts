import type { UpdateUserMutationRequest, UpdateUserMutationResponse } from "../../models/ts/userController/UpdateUser.ts";

export function updateUser(data?: UpdateUserMutationRequest): Cypress.Chainable<UpdateUserMutationResponse> {
  return cy.request('put', '/user/:username', data).then((res: Cypress.Response<UpdateUserMutationResponse>) => res.body)
}