import type { GetTransfersByIdQueryResponse } from '../../models/ts/transfersController/GetTransfersById.ts'

export function getTransfersById(): Cypress.Chainable<GetTransfersByIdQueryResponse> {
  return cy.request('get', '/v1/transfers/:id', undefined).then((res: Cypress.Response<GetTransfersByIdQueryResponse>) => res.body)
}
