import type { DeleteOrderResponseData, DeleteOrderPathParams } from '../../models/ts/storeController/DeleteOrder.ts'

export function deleteOrder(orderId: DeleteOrderPathParams['orderId'], options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<DeleteOrderResponseData> {
  return cy
    .request<DeleteOrderResponseData>({
      method: 'delete',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
