import { faker } from '@faker-js/faker'
import type { ListTransfersQueryParams, ListTransfersQueryResponse } from '../../models/ts/transfersController/ListTransfers.ts'
import { createPageTransferFaker } from '../createPageTransferFaker.ts'

export function createListTransfersQueryParamsFaker(data?: Partial<ListTransfersQueryParams>): ListTransfersQueryParams {
  return {
    ...{ cursor: faker.string.alpha(), limit: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description Returns a list of transfers.
 */
export function createListTransfers200Faker() {
  return createPageTransferFaker()
}

/**
 * @description Bad request
 */
export function createListTransfers400Faker() {
  return undefined
}

/**
 * @description Unauthorized
 */
export function createListTransfers401Faker() {
  return undefined
}

/**
 * @description Forbidden
 */
export function createListTransfers403Faker() {
  return undefined
}

/**
 * @description Internal server error
 */
export function createListTransfers500Faker() {
  return undefined
}

export function createListTransfersQueryResponseFaker(data?: Partial<ListTransfersQueryResponse>): ListTransfersQueryResponse {
  return data || faker.helpers.arrayElement<any>([createListTransfers200Faker()])
}
