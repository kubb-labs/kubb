import type { GetOrderByIdQueryResponse } from '../../models/ts/storeController/GetOrderById.ts'

export function getOrderById(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetOrderByIdQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/store/order/:orderId',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<GetOrderByIdQueryResponse>) => res.body)
}
