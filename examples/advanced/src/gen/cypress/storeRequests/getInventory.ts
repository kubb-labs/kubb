import type { GetInventoryResponseData } from '../../models/ts/storeController/GetInventory.ts'

export function getInventory(options?: Partial<Cypress.RequestOptions>): Cypress.Chainable<GetInventoryResponseData> {
  return cy
    .request<GetInventoryResponseData>({
      method: 'get',
      url: '/store/inventory',
      ...options,
    })
    .then((res) => res.body)
}
