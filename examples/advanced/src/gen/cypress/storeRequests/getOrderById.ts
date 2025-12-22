import type { GetOrderByIdQueryResponse, GetOrderByIdPathParams } from '../../models/ts/storeController/GetOrderById.ts'

export function getOrderById(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<GetOrderByIdQueryResponse> {
  return cy
    .request<GetOrderByIdQueryResponse>({
      method: 'get',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
