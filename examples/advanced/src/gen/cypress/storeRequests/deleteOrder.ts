import type { DeleteOrderMutationResponse, DeleteOrderPathParams } from '../../models/ts/storeController/DeleteOrder.ts'

export function deleteOrder(
  orderId: DeleteOrderPathParams['orderId'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<DeleteOrderMutationResponse> {
  return cy
    .request<DeleteOrderMutationResponse>({
      method: 'delete',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
