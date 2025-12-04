import { faker } from '@faker-js/faker'
import type { CreateVendorHeaderParams, CreateVendorMutationResponse } from '../../models/ts/vendorsController/CreateVendor.ts'
import { createCreateVendorRequestFaker } from '../createCreateVendorRequestFaker.ts'
import { createVendorResponseFaker } from '../createVendorResponseFaker.ts'

export function createCreateVendorHeaderParamsFaker(data?: Partial<CreateVendorHeaderParams>): CreateVendorHeaderParams {
  return {
    ...{ 'Idempotency-Key': faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description createVendor 200 response
 */
export function createCreateVendor200Faker() {
  return createVendorResponseFaker()
}

export function createCreateVendorMutationRequestFaker() {
  return createCreateVendorRequestFaker()
}

export function createCreateVendorMutationResponseFaker(data?: Partial<CreateVendorMutationResponse>): CreateVendorMutationResponse {
  return data || faker.helpers.arrayElement<any>([createCreateVendor200Faker()])
}
