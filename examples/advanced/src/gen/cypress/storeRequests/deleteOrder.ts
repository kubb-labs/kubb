import type { DeleteOrderPathParams, DeleteOrderMutationResponse } from '../../models/ts/storeController/DeleteOrder.ts'

export function deleteOrder(
  orderId: DeleteOrderPathParams['orderId'],
  options: Partial<Cypress.RequestOptions> = {},
): Cypress.Chainable<DeleteOrderMutationResponse> {
  return cy
    .request<DeleteOrderMutationResponse>({
      method: 'DELETE',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
