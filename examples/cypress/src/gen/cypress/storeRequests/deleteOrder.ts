import type { DeleteOrderMutationResponse } from '../../models/DeleteOrder.ts'

export function deleteOrder(): Cypress.Chainable<DeleteOrderMutationResponse> {
  return cy.request('delete', 'http://localhost:3000/store/order/:orderId', undefined).then((res: Cypress.Response<DeleteOrderMutationResponse>) => res.body)
}
