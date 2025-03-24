import type { DeleteUserMutationResponse } from '../../models/DeleteUser.ts'

export function deleteUser(): Cypress.Chainable<DeleteUserMutationResponse> {
  return cy.request('delete', 'http://localhost:3000/user/:username', undefined).then((res: Cypress.Response<DeleteUserMutationResponse>) => res.body)
}
