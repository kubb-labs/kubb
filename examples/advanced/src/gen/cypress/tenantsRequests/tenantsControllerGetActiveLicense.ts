import type { TenantsControllerGetActiveLicenseQueryResponse } from '../../models/ts/tenantsController/TenantsControllerGetActiveLicense.ts'

export function tenantsControllerGetActiveLicense(): Cypress.Chainable<TenantsControllerGetActiveLicenseQueryResponse> {
  return cy
    .request('get', '/api/tenants/:id/active-license', undefined)
    .then((res: Cypress.Response<TenantsControllerGetActiveLicenseQueryResponse>) => res.body)
}
