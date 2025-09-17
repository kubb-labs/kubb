import type {
  WeldPacksControllerDeactivateLicensePathParams,
  WeldPacksControllerDeactivateLicenseMutationResponse,
} from '../../models/ts/weldPacksController/WeldPacksControllerDeactivateLicense.ts'
import { createWeldPackFaker } from '../createWeldPackFaker.ts'
import { faker } from '@faker-js/faker'

export function createWeldPacksControllerDeactivateLicensePathParamsFaker(
  data?: Partial<WeldPacksControllerDeactivateLicensePathParams>,
): WeldPacksControllerDeactivateLicensePathParams {
  return {
    ...{ id: faker.number.float() },
    ...(data || {}),
  }
}

export function createWeldPacksControllerDeactivateLicense200Faker() {
  return createWeldPackFaker()
}

export function createWeldPacksControllerDeactivateLicenseMutationResponseFaker(
  data?: Partial<WeldPacksControllerDeactivateLicenseMutationResponse>,
): WeldPacksControllerDeactivateLicenseMutationResponse {
  return data || faker.helpers.arrayElement<any>([createWeldPacksControllerDeactivateLicense200Faker()])
}
