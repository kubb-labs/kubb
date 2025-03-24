import type { GetOrderByIdQueryResponse } from '../../models/GetOrderById.ts'

export function getOrderById(): Cypress.Chainable<GetOrderByIdQueryResponse> {
  return cy.request('get', 'http://localhost:3000/store/order/:orderId', undefined).then((res: Cypress.Response<GetOrderByIdQueryResponse>) => res.body)
}
