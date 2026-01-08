import type { GetOrderByIdPathParams, GetOrderByIdResponseData } from '../../models/ts/storeController/GetOrderById.ts'

export function getOrderById(
  orderId: GetOrderByIdPathParams['orderId'],
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<GetOrderByIdResponseData> {
  return cy
    .request<GetOrderByIdResponseData>({
      method: 'get',
      url: `/store/order/${orderId}`,
      ...options,
    })
    .then((res) => res.body)
}
