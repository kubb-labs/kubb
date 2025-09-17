import type { TenantsControllerGetActiveWeldPackQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetActiveWeldPack.ts'

export function tenantsControllerGetActiveWeldPack(): Cypress.Chainable<TenantsControllerGetActiveWeldPackQueryResponse> {
  return cy
    .request('get', '/api/tenants/:id/active-weldpack', undefined)
    .then((res: Cypress.Response<TenantsControllerGetActiveWeldPackQueryResponse>) => res.body)
}
