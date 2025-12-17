import type { PlaceOrderPatchMutationRequest, PlaceOrderPatchMutationResponse } from '../../models/ts/storeController/PlaceOrderPatch.ts'

export function placeOrderPatch(
  data?: PlaceOrderPatchMutationRequest,
  options?: Partial<Cypress.RequestOptions>,
): Cypress.Chainable<PlaceOrderPatchMutationResponse> {
  return cy
    .request({
      method: 'patch',
      url: '/store/order',
      body: data,
      ...options,
    })
    .then((res: Cypress.Response<PlaceOrderPatchMutationResponse>) => res.body)
}
