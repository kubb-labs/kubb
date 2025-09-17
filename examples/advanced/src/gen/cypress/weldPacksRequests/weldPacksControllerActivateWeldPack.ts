import type {
  WeldPacksControllerActivateWeldPackMutationRequest,
  WeldPacksControllerActivateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerActivateWeldPack.ts'

export function weldPacksControllerActivateWeldPack(
  data: WeldPacksControllerActivateWeldPackMutationRequest,
): Cypress.Chainable<WeldPacksControllerActivateWeldPackMutationResponse> {
  return cy.request('post', '/api/weldpacks/:id/activate', data).then((res: Cypress.Response<WeldPacksControllerActivateWeldPackMutationResponse>) => res.body)
}
