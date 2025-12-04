import type { ListLinkedAccountsQueryResponse } from '../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'

export function listLinkedAccounts(): Cypress.Chainable<ListLinkedAccountsQueryResponse> {
  return cy.request('get', '/v1/linked_accounts', undefined).then((res: Cypress.Response<ListLinkedAccountsQueryResponse>) => res.body)
}
