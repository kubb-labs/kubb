import type { AppControllerGetStatusQueryResponse } from '../../models/ts/appController/AppControllerGetStatus.ts'

export function appControllerGetStatus(): Cypress.Chainable<AppControllerGetStatusQueryResponse> {
  return cy.request('get', '/api/status', undefined).then((res: Cypress.Response<AppControllerGetStatusQueryResponse>) => res.body)
}
