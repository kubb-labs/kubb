import type { DeleteOrderMutationResponse } from '../../models/ts/storeController/DeleteOrder.ts'

export function deleteOrder(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<DeleteOrderMutationResponse> {
  return cy
    .request({
      method: 'delete',
      url: '/store/order/:orderId',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<DeleteOrderMutationResponse>) => res.body)
}
