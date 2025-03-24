import type { CreateUsersWithListInputMutationRequest, CreateUsersWithListInputMutationResponse } from '../../models/CreateUsersWithListInput.ts'

export function createUsersWithListInput(data?: CreateUsersWithListInputMutationRequest): Cypress.Chainable<CreateUsersWithListInputMutationResponse> {
  return cy
    .request('post', 'http://localhost:3000/user/createWithList', data)
    .then((res: Cypress.Response<CreateUsersWithListInputMutationResponse>) => res.body)
}
