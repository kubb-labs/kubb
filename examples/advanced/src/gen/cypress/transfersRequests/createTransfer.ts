import type { CreateTransferMutationRequest, CreateTransferMutationResponse } from '../../models/ts/transfersController/CreateTransfer.ts'

export function createTransfer(data: CreateTransferMutationRequest): Cypress.Chainable<CreateTransferMutationResponse> {
  return cy.request('post', '/v1/transfers', data).then((res: Cypress.Response<CreateTransferMutationResponse>) => res.body)
}
