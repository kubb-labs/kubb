import { faker } from '@faker-js/faker'
import { createPet } from '../createPet'
import type { GetPetByIdPathParams, GetPetById200, GetPetById400, GetPetById404, GetPetByIdQueryResponse } from '../../models/GetPetById'

export function createGetPetByIdPathParams(override: NonNullable<Partial<GetPetByIdPathParams>> = {}): NonNullable<GetPetByIdPathParams> {
  faker.seed([220])
  return {
    ...{ 'petId': faker.number.int() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createGetPetById200(override?: NonNullable<Partial<GetPetById200>>): NonNullable<GetPetById200> {
  faker.seed([220])
  return createPet(override)
}

/**
 * @description Invalid ID supplied
 */
export function createGetPetById400(override?: NonNullable<Partial<GetPetById400>>): NonNullable<GetPetById400> {
  faker.seed([220])
  return undefined
}

/**
 * @description Pet not found
 */
export function createGetPetById404(override?: NonNullable<Partial<GetPetById404>>): NonNullable<GetPetById404> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createGetPetByIdQueryResponse(override?: NonNullable<Partial<GetPetByIdQueryResponse>>): NonNullable<GetPetByIdQueryResponse> {
  faker.seed([220])
  return createPet(override)
}
