import type { PlaceOrderPatchRequestData, PlaceOrderPatchResponseData } from '../../models/ts/storeController/PlaceOrderPatch.ts'

export function placeOrderPatch(data?: PlaceOrderPatchRequestData, options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<PlaceOrderPatchResponseData> {
  return cy
    .request<PlaceOrderPatchResponseData>({
      method: 'patch',
      url: '/store/order',
      body: data,
      ...options,
    })
    .then((res) => res.body)
}
