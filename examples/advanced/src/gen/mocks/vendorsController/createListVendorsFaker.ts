import type { ListVendorsQueryParams, ListVendorsQueryResponse } from '../../models/ts/vendorsController/ListVendors.ts'
import { createPageVendorResponseFaker } from '../createPageVendorResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createListVendorsQueryParamsFaker(data?: Partial<ListVendorsQueryParams>): ListVendorsQueryParams {
  return {
    ...{ cursor: faker.string.alpha(), limit: faker.number.int(), name: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Returns a list of vendor objects.
 */
export function createListVendors200Faker() {
  return createPageVendorResponseFaker()
}

/**
 * @description Bad request
 */
export function createListVendors400Faker() {
  return undefined
}

/**
 * @description Unauthorized
 */
export function createListVendors401Faker() {
  return undefined
}

/**
 * @description Forbidden
 */
export function createListVendors403Faker() {
  return undefined
}

export function createListVendorsQueryResponseFaker(data?: Partial<ListVendorsQueryResponse>): ListVendorsQueryResponse {
  return data || faker.helpers.arrayElement<any>([createListVendors200Faker()])
}
