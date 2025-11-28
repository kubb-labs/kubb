import type { ListTransfersQueryResponse } from '../../models/ts/transfersController/ListTransfers.ts'

export function listTransfers(): Cypress.Chainable<ListTransfersQueryResponse> {
  return cy.request('get', '/v1/transfers', undefined).then((res: Cypress.Response<ListTransfersQueryResponse>) => res.body)
}
