import type { WeldPacksControllerGetWeldPacksQueryResponse } from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPacks.ts'

export function weldPacksControllerGetWeldPacks(): Cypress.Chainable<WeldPacksControllerGetWeldPacksQueryResponse> {
  return cy.request('get', '/api/weldpacks', undefined).then((res: Cypress.Response<WeldPacksControllerGetWeldPacksQueryResponse>) => res.body)
}
