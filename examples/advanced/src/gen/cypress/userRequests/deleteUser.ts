import type { DeleteUserMutationResponse } from "../../models/ts/userController/DeleteUser.ts";

export function deleteUser(): Cypress.Chainable<DeleteUserMutationResponse> {
  return cy.request('delete', '/user/:username', undefined).then((res: Cypress.Response<DeleteUserMutationResponse>) => res.body)
}