import { faker } from '@faker-js/faker'
import type { UpdateVendorHeaderParams, UpdateVendorMutationResponse, UpdateVendorPathParams } from '../../models/ts/vendorsController/UpdateVendor.ts'
import { createUpdateVendorRequestFaker } from '../createUpdateVendorRequestFaker.ts'
import { createVendorResponseFaker } from '../createVendorResponseFaker.ts'

export function createUpdateVendorPathParamsFaker(data?: Partial<UpdateVendorPathParams>): UpdateVendorPathParams {
  return {
    ...{ id: faker.string.alpha() },
    ...(data || {}),
  }
}

export function createUpdateVendorHeaderParamsFaker(data?: Partial<UpdateVendorHeaderParams>): UpdateVendorHeaderParams {
  return {
    ...{ 'Idempotency-Key': faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description updateVendor 200 response
 */
export function createUpdateVendor200Faker() {
  return createVendorResponseFaker()
}

export function createUpdateVendorMutationRequestFaker() {
  return createUpdateVendorRequestFaker()
}

export function createUpdateVendorMutationResponseFaker(data?: Partial<UpdateVendorMutationResponse>): UpdateVendorMutationResponse {
  return data || faker.helpers.arrayElement<any>([createUpdateVendor200Faker()])
}
