import type { GetVendorByIdPathParams, GetVendorByIdQueryResponse } from '../../models/ts/vendorsController/GetVendorById.ts'
import { createVendorResponseFaker } from '../createVendorResponseFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetVendorByIdPathParamsFaker(data?: Partial<GetVendorByIdPathParams>): GetVendorByIdPathParams {
  return {
    ...{ id: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description Returns a vendor object.
 */
export function createGetVendorById200Faker() {
  return createVendorResponseFaker()
}

/**
 * @description Bad request
 */
export function createGetVendorById400Faker() {
  return undefined
}

/**
 * @description Unauthorized
 */
export function createGetVendorById401Faker() {
  return undefined
}

/**
 * @description Forbidden
 */
export function createGetVendorById403Faker() {
  return undefined
}

/**
 * @description Internal server error
 */
export function createGetVendorById500Faker() {
  return undefined
}

export function createGetVendorByIdQueryResponseFaker(data?: Partial<GetVendorByIdQueryResponse>): GetVendorByIdQueryResponse {
  return data || faker.helpers.arrayElement<any>([createGetVendorById200Faker()])
}
