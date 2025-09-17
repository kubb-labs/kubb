import type { WeldPacksControllerGetWeldPackQueryResponse } from '../../models/ts/weldPacksController/WeldPacksControllerGetWeldPack.ts'

export function weldPacksControllerGetWeldPack(): Cypress.Chainable<WeldPacksControllerGetWeldPackQueryResponse> {
  return cy.request('get', '/api/weldpacks/:id', undefined).then((res: Cypress.Response<WeldPacksControllerGetWeldPackQueryResponse>) => res.body)
}
