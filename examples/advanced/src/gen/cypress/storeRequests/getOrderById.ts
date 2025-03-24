import type { GetOrderByIdQueryResponse } from '../../models/ts/storeController/GetOrderById.ts'

export function getOrderById(): Cypress.Chainable<GetOrderByIdQueryResponse> {
  return cy.request('get', '/store/order/:orderId', undefined).then((res: Cypress.Response<GetOrderByIdQueryResponse>) => res.body)
}
