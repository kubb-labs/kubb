import type { WeldPacksControllerDeactivateLicenseMutationResponse } from '../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'

export function weldPacksControllerDeactivateLicense(): Cypress.Chainable<WeldPacksControllerDeactivateLicenseMutationResponse> {
  return cy
    .request('post', '/api/weldpacks/:id/deactivate', undefined)
    .then((res: Cypress.Response<WeldPacksControllerDeactivateLicenseMutationResponse>) => res.body)
}
