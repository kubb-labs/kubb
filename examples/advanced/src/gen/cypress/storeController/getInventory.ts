import type { GetInventoryQueryResponse } from '../../models/ts/storeController/GetInventory.ts'

export function getInventory(options: Partial<Cypress.RequestOptions> = {}): Cypress.Chainable<GetInventoryQueryResponse> {
  return cy
    .request<GetInventoryQueryResponse>({
      method: 'get',
      url: '/store/inventory',
      ...options,
    })
    .then((res) => res.body)
}
