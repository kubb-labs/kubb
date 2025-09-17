import type {
  WeldPacksControllerCreateWeldPackMutationRequest,
  WeldPacksControllerCreateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerCreateWeldPack.ts'

export function weldPacksControllerCreateWeldPack(
  data: WeldPacksControllerCreateWeldPackMutationRequest,
): Cypress.Chainable<WeldPacksControllerCreateWeldPackMutationResponse> {
  return cy.request('post', '/api/weldpacks', data).then((res: Cypress.Response<WeldPacksControllerCreateWeldPackMutationResponse>) => res.body)
}
