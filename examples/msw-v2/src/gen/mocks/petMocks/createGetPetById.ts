import { faker } from '@faker-js/faker'
import type { GetPetById200, GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/GetPetById'
import { createPet } from '../createPet'

export function createGetPetByIdPathParams(): NonNullable<GetPetByIdPathParams> {
  faker.seed([220])
  return { petId: faker.number.int() }
}

/**
 * @description successful operation
 */
export function createGetPetById200(): NonNullable<GetPetById200> {
  faker.seed([220])
  return createPet()
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(): NonNullable<GetPetById400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(): NonNullable<GetPetById404> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(): NonNullable<GetPetByIdQueryResponse> {
  faker.seed([220])
  return createPet()
}
