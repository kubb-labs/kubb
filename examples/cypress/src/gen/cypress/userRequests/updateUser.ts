import type { UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/UpdateUser.ts'

export function updateUser(data?: UpdateUserMutationRequest): Cypress.Chainable<UpdateUserMutationResponse> {
  return cy.request('put', 'http://localhost:3000/user/:username', data).then((res: Cypress.Response<UpdateUserMutationResponse>) => res.body)
}
