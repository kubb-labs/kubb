import { faker } from '@faker-js/faker'
import type { ListLinkedAccountsQueryParams, ListLinkedAccountsQueryResponse } from '../../models/ts/linkedAccountsController/ListLinkedAccounts.ts'
import { createPageBankConnectionFaker } from '../createPageBankConnectionFaker.ts'

export function createListLinkedAccountsQueryParamsFaker(data?: Partial<ListLinkedAccountsQueryParams>): ListLinkedAccountsQueryParams {
  return {
    ...{ cursor: faker.string.alpha(), limit: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Returns a list of bank connections
 */
export function createListLinkedAccounts200Faker() {
  return createPageBankConnectionFaker()
}

/**
 * @description Bad request
 */
export function createListLinkedAccounts400Faker() {
  return undefined
}

/**
 * @description Unauthorized
 */
export function createListLinkedAccounts401Faker() {
  return undefined
}

/**
 * @description Forbidden
 */
export function createListLinkedAccounts403Faker() {
  return undefined
}

export function createListLinkedAccountsQueryResponseFaker(data?: Partial<ListLinkedAccountsQueryResponse>): ListLinkedAccountsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createListLinkedAccounts200Faker()])
}
