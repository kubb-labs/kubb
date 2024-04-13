import { faker } from '@faker-js/faker'
import type { GetPetById200, GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/ts/petController/GetPetById'
import { createPet } from '../createPet'

export function createGetPetByIdPathParams(): NonNullable<GetPetByIdPathParams> {
  return { petId: faker.number.int() }
}

/**
 * @description successful operation
 */
export function createGetPetById200(): NonNullable<GetPetById200> {
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(): NonNullable<GetPetById400> {
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(): NonNullable<GetPetById404> {
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(): NonNullable<GetPetByIdQueryResponse> {
  return createPet()
}
