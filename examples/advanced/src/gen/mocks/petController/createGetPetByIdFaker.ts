import type { GetPetByIdPathParams, GetPetByIdResponseData } from '../../models/ts/petController/GetPetById.ts'
import { createPetFaker } from '../createPetFaker.ts'
import { faker } from '@faker-js/faker'

export function createGetPetByIdPathParamsFaker(data?: Partial<GetPetByIdPathParams>): GetPetByIdPathParams {
  return {
    ...{ petId: faker.number.int() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createGetPetByIdStatus200Faker() {
  return createPetFaker()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetByIdStatus400Faker() {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetByIdStatus404Faker() {
  return undefined
}

export function createGetPetByIdResponseDataFaker(data?: Partial<GetPetByIdResponseData>): GetPetByIdResponseData {
  return data || faker.helpers.arrayElement<any>([createGetPetByIdStatus200Faker()])
}
