import type { GetInventoryQueryResponse } from '../../models/ts/storeController/GetInventory.ts'

export function getInventory(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetInventoryQueryResponse> {
  return cy
    .request({
      method: 'get',
      url: '/store/inventory',
      body: undefined,
      ...options,
    })
    .then((res: Cypress.Response<GetInventoryQueryResponse>) => res.body)
}
