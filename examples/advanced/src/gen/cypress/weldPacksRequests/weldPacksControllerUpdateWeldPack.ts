import type {
  WeldPacksControllerUpdateWeldPackMutationRequest,
  WeldPacksControllerUpdateWeldPackMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerUpdateWeldPack.ts'

export function weldPacksControllerUpdateWeldPack(
  data: WeldPacksControllerUpdateWeldPackMutationRequest,
): Cypress.Chainable<WeldPacksControllerUpdateWeldPackMutationResponse> {
  return cy.request('patch', '/api/weldpacks/:id', data).then((res: Cypress.Response<WeldPacksControllerUpdateWeldPackMutationResponse>) => res.body)
}
