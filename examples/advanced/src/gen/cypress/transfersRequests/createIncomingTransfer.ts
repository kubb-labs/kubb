import type {
  CreateIncomingTransferMutationRequest,
  CreateIncomingTransferMutationResponse,
} from '../../models/ts/transfersController/CreateIncomingTransfer.ts'

export function createIncomingTransfer(data: CreateIncomingTransferMutationRequest): Cypress.Chainable<CreateIncomingTransferMutationResponse> {
  return cy.request('post', '/v1/incoming_transfers', data).then((res: Cypress.Response<CreateIncomingTransferMutationResponse>) => res.body)
}
