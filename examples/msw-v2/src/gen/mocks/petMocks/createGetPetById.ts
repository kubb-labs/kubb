import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { GetPetById400, GetPetById404, GetPetByIdPathParams, GetPetByIdQueryResponse } from '../../models/GetPetById'

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

export function createGetPetByIdPathParams(): NonNullable<GetPetByIdPathParams> {
  faker.seed([220])
  return { 'petId': faker.number.float({}) }
}
/**
 * @description successful operation
 */

export function createGetPetByIdQueryResponse(): NonNullable<GetPetByIdQueryResponse> {
  faker.seed([220])
  return createPet()
}
