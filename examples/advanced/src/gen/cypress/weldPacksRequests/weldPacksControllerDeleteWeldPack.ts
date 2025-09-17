import type { WeldPacksControllerDeleteWeldPackMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerDeleteWeldPack.ts'

export function weldPacksControllerDeleteWeldPack(): Cypress.Chainable<WeldPacksControllerDeleteWeldPackMutationResponse> {
  return cy.request('delete', '/api/weldpacks/:id', undefined).then((res: Cypress.Response<WeldPacksControllerDeleteWeldPackMutationResponse>) => res.body)
}
