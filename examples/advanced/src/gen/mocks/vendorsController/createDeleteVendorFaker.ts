import type { DeleteVendorPathParams, DeleteVendorMutationResponse } from '../../models/ts/vendorsController/DeleteVendor.ts'
import { faker } from '@faker-js/faker'

export function createDeleteVendorPathParamsFaker(data?: Partial<DeleteVendorPathParams>): DeleteVendorPathParams {
  return {
    ...{ id: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description deleteVendor 200 response
 */
export function createDeleteVendor200Faker() {
  return undefined
}

export function createDeleteVendorMutationResponseFaker(data?: Partial<DeleteVendorMutationResponse>): DeleteVendorMutationResponse {
  return data || faker.helpers.arrayElement<any>([createDeleteVendor200Faker()])
}
